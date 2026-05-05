from datetime import datetime
from pydantic import BaseModel


class CategoryBrief(BaseModel):
    id: int
    name: str
    color: str | None

    model_config = {"from_attributes": True}


class TaskCreate(BaseModel):
    title: str
    priority: str = "medium"
    due_date: datetime | None = None
    category_id: int | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    status: str
    priority: str
    due_date: datetime | None
    category_id: int | None

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
