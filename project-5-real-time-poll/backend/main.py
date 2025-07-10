import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List

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

# --- Путь к файлу для сохранения опросов ---
DATA_FILE = "polls.json"

# --- Изначальный дефолтный опрос ---
poll_data = {
    "question": "Ваш любимый фреймворк для бэкенда?",
    "options": {
        "fastapi": {"label": "FastAPI", "votes": 0},
        "django": {"label": "Django", "votes": 0},
        "flask": {"label": "Flask", "votes": 0},
        "nodejs": {"label": "Node.js (Express)", "votes": 0}
    }
}

# --- Словарь для хранения всех опросов (id -> poll) ---
polls: Dict[str, dict] = {}

# --- Загрузка опросов при старте ---
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        polls = json.load(f)
else:
    polls = {"default": poll_data}

# --- Pydantic модели ---
class PollResponse(BaseModel):
    question: str
    options: Dict[str, Dict[str, int | str]]

class CreatePollRequest(BaseModel):
    question: str
    options: List[str]

# --- Сохранение в файл ---
def save_polls():
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(polls, f, ensure_ascii=False, indent=2)

# --- Получение конкретного опроса ---
def get_poll_or_404(poll_id: str):
    poll = polls.get(poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return poll

# --- Эндпоинты ---

@app.get("/api/poll/{poll_id}", response_model=PollResponse)
def get_poll(poll_id: str):
    return get_poll_or_404(poll_id)

@app.post("/api/poll/vote/{poll_id}/{option_key}", response_model=PollResponse)
def vote(poll_id: str, option_key: str):
    poll = get_poll_or_404(poll_id)
    if option_key not in poll["options"]:
        raise HTTPException(status_code=404, detail="Option not found")
    poll["options"][option_key]["votes"] += 1
    save_polls()
    return poll

@app.post("/api/poll/create")
def create_poll(request: CreatePollRequest):
    # Генерируем уникальный ID для нового опроса
    poll_id = f"poll{len(polls) + 1}"
    options_dict = {}

    for idx, option_text in enumerate(request.options):
        key = f"option{idx+1}"
        options_dict[key] = {"label": option_text, "votes": 0}

    new_poll = {
        "question": request.question,
        "options": options_dict
    }

    polls[poll_id] = new_poll
    save_polls()

    return {"poll_id": poll_id, "message": "Опрос успешно создан"}

@app.get("/api/polls")
def get_all_polls():
    """Вернуть список всех опросов (id + вопрос)."""
    return [{"id": poll_id, "question": poll["question"]} for poll_id, poll in polls.items()]