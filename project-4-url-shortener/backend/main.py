import secrets
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from urllib.parse import urlparse
from typing import Optional
from datetime import datetime, timedelta

app = FastAPI()

# --- Настройка CORS ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- "База данных" в памяти ---
# Пример: {"abc123": {"long_url": "...", "clicks": 0, "created_at": datetime}}
url_db = {}

# --- Срок действия ссылки в днях ---
EXPIRE_AFTER_DAYS = 7

# --- Модель запроса ---
class URLCreate(BaseModel):
    long_url: str
    custom_code: Optional[str] = None

    @validator('long_url')
    def validate_url(cls, v):
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("Недопустимый URL")
        return v

# --- Эндпоинт создания короткой ссылки ---
@app.post("/api/shorten")
def create_short_url(url_data: URLCreate, request: Request):
    long_url = str(url_data.long_url)

    if url_data.custom_code:
        short_code = url_data.custom_code
        if short_code in url_db:
            raise HTTPException(status_code=400, detail="Этот код уже занят.")
    else:
        short_code = secrets.token_urlsafe(4)
        while short_code in url_db:
            short_code = secrets.token_urlsafe(4)

    url_db[short_code] = {
        "long_url": long_url,
        "clicks": 0,
        "created_at": datetime.utcnow()
    }

    base_url = str(request.base_url)
    short_url = f"{base_url}{short_code}"

    return {"short_url": short_url, "clicks": 0}

# --- Эндпоинт редиректа по короткой ссылке ---
@app.get("/{short_code}")
def redirect_to_long_url(short_code: str):
    data = url_db.get(short_code)

    if not data:
        raise HTTPException(status_code=404, detail="Ссылка не найдена")

    created_at = data["created_at"]
    if datetime.utcnow() > created_at + timedelta(days=EXPIRE_AFTER_DAYS):
        raise HTTPException(status_code=404, detail="Срок действия ссылки истёк.")

    data["clicks"] += 1

    return RedirectResponse(url=data["long_url"])