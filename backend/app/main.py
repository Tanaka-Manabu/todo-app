from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import User, Category, Task
from app.routers import auth, tasks, categories

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TODO管理システム API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(categories.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
