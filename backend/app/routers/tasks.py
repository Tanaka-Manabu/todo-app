from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse, TaskListResponse
from app.auth import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/tasks", tags=["tasks"])
bearer = HTTPBearer()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> int:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="認証が必要です")


class TaskUpdate(BaseModel):
    title: str
    priority: str
    due_date: datetime | None = None
    category_id: int | None = None


@router.get("", response_model=TaskListResponse)
def list_tasks(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id, Task.status != "deleted")
        .order_by(Task.created_at.desc())
        .all()
    )
    return TaskListResponse(tasks=tasks)


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(req: TaskCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    task = Task(user_id=user_id, title=req.title, priority=req.priority, due_date=req.due_date, category_id=req.category_id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/complete", response_model=TaskResponse)
def complete_task(task_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    task.status = "done"
    task.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/restore", response_model=TaskResponse)
def restore_task(task_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    task.status = "todo"
    task.completed_at = None
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, req: TaskUpdate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id, Task.status != "deleted").first()
    if not task:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    task.title = req.title
    task.priority = req.priority
    task.due_date = req.due_date
    task.category_id = req.category_id
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id, Task.status != "deleted").first()
    if not task:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    task.status = "deleted"
    task.deleted_at = datetime.utcnow()
    db.commit()
