import os
import sys
import uuid

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete

from main import app, get_db, Base, Note, User


TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = sessionmaker(bind=engine_test, class_=AsyncSession, expire_on_commit=False)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_test_db():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def client():
    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as c:
        async with TestSessionLocal() as session:
            await session.execute(delete(Note))
            await session.execute(delete(User))
            await session.commit()
        yield c

@pytest.mark.asyncio
async def test_register_and_login(client):
    username = f"testuser_{uuid.uuid4().hex[:6]}"
    password = "testpass"

    response = await client.post("/register", json={"username": username, "password": password})
    print("Register response:", response.status_code, response.text)
    assert response.status_code == 200
    user = response.json()
    assert user["username"] == username

    response = await client.post("/login", data={"username": username, "password": password})
    print("Login response:", response.status_code, response.text)
    assert response.status_code == 200
    token = response.json()["access_token"]
    assert token

    return token, username

@pytest.mark.asyncio
async def test_protected_routes(client):
    token, username = await test_register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/users/me", headers=headers)
    print("Protected route response:", response.status_code, response.text)
    assert response.status_code == 200
    assert response.json()["username"] == username

@pytest.mark.asyncio
async def test_notes_crud(client):
    token, _ = await test_register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post("/notes", headers=headers, json={"text": "Hello World"})
    print("Create note:", response.status_code, response.text)
    assert response.status_code == 200
    note = response.json()
    note_id = note["id"]
    assert note["text"] == "Hello World"

    response = await client.get("/notes", headers=headers)
    print("Get notes list:", response.status_code, response.text)
    assert response.status_code == 200
    notes = response.json()
    assert isinstance(notes, list)
    assert len(notes) == 1

    response = await client.get(f"/notes/{note_id}", headers=headers)
    print("Get note by ID:", response.status_code, response.text)
    assert response.status_code == 200
    assert response.json()["id"] == note_id

    response = await client.delete(f"/notes/{note_id}", headers=headers)
    print("Delete note:", response.status_code, response.text)
    assert response.status_code == 200
