import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# --- App Configuration ---
app = FastAPI()

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models (Data Shape) ---
class TodoItem(BaseModel):
    id: str
    task: str
    completed: bool = False

class TodoCreate(BaseModel):
    task: str  # Only need the task text to create a new todo

# --- In-Memory Database ---
fake_todo_db: List[TodoItem] = []

# --- API Endpoints ---

@app.put("/api/todos/{todo_id}")
async def update_todo(todo_id: str, todo: TodoItem):
    for task in fake_todo_db:
        if task.id == todo_id:
            task.task = todo.task  # Update the task text
            return {"message": "Task updated successfully", "task": task}
    raise HTTPException(status_code=404, detail="Task not found")

@app.get("/api/todos", response_model=List[TodoItem])
async def get_all_todos():
    """Returns all items in the to-do list."""
    return fake_todo_db

@app.post("/api/todos", response_model=TodoItem, status_code=201)
async def create_todo(todo_data: TodoCreate):
    """Creates a new to-do item."""
    new_todo = TodoItem(
        id=str(uuid.uuid4()),  # Generate a unique ID
        task=todo_data.task,
        completed=False
    )
    fake_todo_db.append(new_todo)
    return new_todo

@app.patch("/api/todos/{todo_id}", response_model=TodoItem)
async def update_todo_status(todo_id: str):
    """Toggles the 'completed' status of a to-do item."""
    for todo in fake_todo_db:
        if todo.id == todo_id:
            todo.completed = not todo.completed
            return todo
    raise HTTPException(status_code=404, detail="Todo not found")

@app.delete("/api/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: str):
    """Deletes a to-do item."""
    todo_to_delete = None
    for todo in fake_todo_db:
        if todo.id == todo_id:
            todo_to_delete = todo
            break
    if not todo_to_delete:
        raise HTTPException(status_code=404, detail="Todo not found")

    fake_todo_db.remove(todo_to_delete)
    return

@app.delete("/api/todos/completed", status_code=204)
async def delete_completed_todos():
    """Удаляет все выполненные задачи."""
    global fake_todo_db
    fake_todo_db = [todo for todo in fake_todo_db if not todo.completed]
    return


# A simple root endpoint to confirm the server is running
@app.get("/")
async def root():
    return {"message": "FastAPI To-Do Backend is running!"}
