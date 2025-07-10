import os
import uuid
import aiofiles
from fastapi import FastAPI, UploadFile, File, HTTPException, Path
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI()

# --- CORS ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Путь для изображений ---
IMAGE_DIR = "static/images/"
os.makedirs(IMAGE_DIR, exist_ok=True)

# --- Раздача статики ---
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Максимальный размер файла: 5 МБ ---
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 мегабайт


# --- Загрузка изображений ---
@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    # Проверка контента
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an image.")

    # Чтение и проверка размера
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File is too large. Max size is 5 MB.")

    # Генерация уникального имени
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(IMAGE_DIR, unique_filename)

    # Асинхронное сохранение
    try:
        async with aiofiles.open(file_path, mode='wb') as out_file:
            await out_file.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {e}")

    # Возврат URL
    return {"url": f"/static/images/{unique_filename}"}


# --- Список изображений ---
@app.get("/api/images", response_model=List[str])
async def get_images():
    try:
        images = os.listdir(IMAGE_DIR)
        image_urls = [
            f"/static/images/{img}"
            for img in images
            if os.path.isfile(os.path.join(IMAGE_DIR, img))
        ]
        return image_urls
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading image directory: {e}")


# --- Удаление изображения ---
@app.delete("/api/images/{filename}")
async def delete_image(filename: str = Path(...)):
    file_path = os.path.join(IMAGE_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")

    try:
        os.remove(file_path)
        return {"message": "File deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {e}")