from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Annotated, Dict
from datetime import datetime, timedelta
import uuid

app = FastAPI()

# --- CORS настройки ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Фейковые пользователи ---
FAKE_USERS = {
    "user": {"username": "user", "password": "password", "role": "user"},
    "admin": {"username": "admin", "password": "adminpass", "role": "admin"},
}

# --- Хранилище токенов ---
ACTIVE_TOKENS: Dict[str, Dict] = {}  # token -> {username, role, created_at}
TOKEN_LIFETIME = timedelta(hours=1)


# --- Модель ответа с токеном ---
class Token(BaseModel):
    access_token: str
    token_type: str


# --- Зависимость: проверка токена и времени ---
async def token_verifier(authorization: Annotated[str, Header()]):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authentication scheme")

    token = authorization.split(" ")[1]
    token_data = ACTIVE_TOKENS.get(token)

    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if datetime.utcnow() - token_data["created_at"] > TOKEN_LIFETIME:
        del ACTIVE_TOKENS[token]
        raise HTTPException(status_code=401, detail="Token expired")

    return token_data  # содержит username и role


# --- Зависимость: проверка роли ---
def require_admin(user_info=Depends(token_verifier)):
    if user_info["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")
    return user_info


# --- Эндпоинт: вход и генерация токена ---
@app.post("/api/login", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = FAKE_USERS.get(form_data.username)

    if not user or user["password"] != form_data.password:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = str(uuid.uuid4())
    ACTIVE_TOKENS[token] = {
        "username": user["username"],
        "role": user["role"],
        "created_at": datetime.utcnow(),
    }

    return {"access_token": token, "token_type": "bearer"}


# --- Эндпоинт: защищённые данные ---
@app.get("/api/secret-data")
async def secret_data(user_info=Depends(token_verifier)):
    return {
        "message": f"Привет, {user_info['username']}! Секретное сообщение: 42.",
        "role": user_info["role"]
    }


# --- Эндпоинт: только для админов ---
@app.get("/api/admin-data")
async def admin_data(user_info=Depends(require_admin)):
    return {"message": f"Привет, {user_info['username']}! Ты админ, вот твои данные."}

@app.get("/api/debug-tokens")
async def debug_tokens():
    return ACTIVE_TOKENS

# --- Эндпоинт: выход и удаление токена ---
@app.post("/api/logout")
async def logout(authorization: Annotated[str, Header()]):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authentication scheme")

    token = authorization.split(" ")[1]
    ACTIVE_TOKENS.pop(token, None)

    return {"message": "Logged out"}