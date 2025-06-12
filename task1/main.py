from email.policy import default
from fileinput import close
from http.client import responses
from operator import index

from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from pydantic import BaseModel
from typing import List
from sqlalchemy import select

DATABASE_URL="postgresql+asyncpg://postgres@localhost:5432/notes"
engine=create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal=sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

Base=declarative_base()

class Note(Base):
    __tablename__="notes"
    id=Column(Integer, primary_key=True, index=True)
    text=Column(String, nullable=False)
    created_at=Column(DateTime, default=datetime.utcnow)

class NoteCreate(BaseModel):
    text:str

class NoteOut(BaseModel):
    id:int
    text:str
    created_at:datetime

    class Config:
        orm_mode=True

app=FastAPI()
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

@app.post("/notes", response_model=NoteOut)
async def create_note(note:NoteCreate, db: AsyncSession=Depends(get_db)):
    new_note = Note(text=note.text)
    db.add(new_note)
    await db.commit()
    await db.refresh(new_note)
    return new_note

@app.get("/notes", response_model=List[NoteOut])
async def read_notes(db: AsyncSession=Depends(get_db)):
    result= await db.execute(select(Note))
    notes= result.scalars().all()
    return notes


