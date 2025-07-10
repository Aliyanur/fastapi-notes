import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, status, Header, Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, select, delete
from pydantic import BaseModel
from typing import List, Dict, Annotated, Optional

DATABASE_URL = "sqlite+aiosqlite:///./microblog.db"

# --- DB Setup ---
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


# --- Models ---
class UserDB(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)

    posts = relationship("PostDB", back_populates="owner")
    likes = relationship("LikeDB", back_populates="user")


class PostDB(Base):
    __tablename__ = "posts"
    id = Column(String, primary_key=True)
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(String, ForeignKey("users.id"))

    owner = relationship("UserDB", back_populates="posts")
    likes = relationship("LikeDB", back_populates="post")


class LikeDB(Base):
    __tablename__ = "likes"
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    post_id = Column(String, ForeignKey("posts.id"), primary_key=True)

    user = relationship("UserDB", back_populates="likes")
    post = relationship("PostDB", back_populates="likes")


# --- Pydantic ---
class Post(BaseModel):
    id: str
    text: str
    timestamp: datetime
    owner_id: str
    owner_username: str
    likes: int

    class Config:
        orm_mode = True


class PostCreate(BaseModel):
    text: str


class User(BaseModel):
    id: str
    username: str


# --- App Init ---
app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# --- Dependency ---
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


# --- Auth ---
FAKE_USERS = {
    "user1": {"id": "1", "username": "user1", "password": "password1"},
    "user2": {"id": "2", "username": "user2", "password": "password2"},
}


async def get_current_user(authorization: Annotated[str, Header()], db: AsyncSession = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid auth scheme")
    token = authorization.split(" ")[1]
    user_data = FAKE_USERS.get(token)
    if not user_data:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return User(**user_data)


@app.post("/api/login")
async def login(form_data: Dict[str, str], db: AsyncSession = Depends(get_db)):
    username = form_data.get("username")
    password = form_data.get("password")
    user = FAKE_USERS.get(username)
    if not user or user["password"] != password:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")

    # ensure user exists in db
    result = await db.execute(select(UserDB).where(UserDB.username == username))
    db_user = result.scalars().first()
    if not db_user:
        db_user = UserDB(id=user["id"], username=user["username"], password=user["password"])
        db.add(db_user)
        await db.commit()
    return {"access_token": user["username"], "token_type": "bearer", "user": {"id": user["id"], "username": user["username"]}}


# --- Posts ---
@app.get("/api/posts", response_model=List[Post])
async def list_posts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PostDB).order_by(PostDB.timestamp.desc()))
    posts = result.scalars().all()
    response = []
    for post in posts:
        likes_count = len(post.likes)
        response.append(Post(
            id=post.id,
            text=post.text,
            timestamp=post.timestamp,
            owner_id=post.owner_id,
            owner_username=post.owner.username,
            likes=likes_count
        ))
    return response


@app.post("/api/posts", response_model=Post, status_code=201)
async def create_post(post_data: PostCreate, current_user: Annotated[User, Depends(get_current_user)], db: AsyncSession = Depends(get_db)):
    db_post = PostDB(
        id=str(uuid.uuid4()),
        text=post_data.text,
        timestamp=datetime.now(timezone.utc),
        owner_id=current_user.id
    )
    db.add(db_post)
    await db.commit()
    await db.refresh(db_post)
    return Post(
        id=db_post.id,
        text=db_post.text,
        timestamp=db_post.timestamp,
        owner_id=db_post.owner_id,
        owner_username=current_user.username,
        likes=0
    )


@app.delete("/api/posts/{post_id}", status_code=204)
async def delete_post(post_id: str, current_user: Annotated[User, Depends(get_current_user)], db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PostDB).where(PostDB.id == post_id))
    post = result.scalars().first()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.owner_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not your post")
    await db.delete(post)
    await db.commit()


# --- Likes ---
@app.post("/api/posts/{post_id}/like", status_code=204)
async def like_post(post_id: str, current_user: Annotated[User, Depends(get_current_user)], db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LikeDB).where(LikeDB.user_id == current_user.id, LikeDB.post_id == post_id))
    existing_like = result.scalars().first()
    if existing_like:
        return
    like = LikeDB(user_id=current_user.id, post_id=post_id)
    db.add(like)
    await db.commit()


@app.delete("/api/posts/{post_id}/like", status_code=204)
async def unlike_post(post_id: str, current_user: Annotated[User, Depends(get_current_user)], db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LikeDB).where(LikeDB.user_id == current_user.id, LikeDB.post_id == post_id))
    like = result.scalars().first()
    if like:
        await db.delete(like)
        await db.commit()


# --- User profile posts ---
@app.get("/api/users/{username}/posts", response_model=List[Post])
async def get_user_posts(username: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserDB).where(UserDB.username == username))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    posts = user.posts
    return [
        Post(
            id=p.id,
            text=p.text,
            timestamp=p.timestamp,
            owner_id=p.owner_id,
            owner_username=username,
            likes=len(p.likes)
        )
        for p in sorted(posts, key=lambda x: x.timestamp, reverse=True)
    ]


# --- Init DB (optional) ---
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)