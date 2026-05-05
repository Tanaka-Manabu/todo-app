from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_db
from app.models.category import Category
from app.auth import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/categories", tags=["categories"])
bearer = HTTPBearer()


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> int:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="認証が必要です")


class CategoryCreate(BaseModel):
    name: str
    color: str | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    color: str | None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[CategoryResponse])
def list_categories(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return db.query(Category).filter(Category.user_id == user_id, Category.deleted_at == None).order_by(Category.sort_order).all()


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(req: CategoryCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    category = Category(user_id=user_id, name=req.name, color=req.color)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    from datetime import datetime
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == user_id, Category.deleted_at == None).first()
    if not category:
        raise HTTPException(status_code=404, detail="カテゴリが見つかりません")
    category.deleted_at = datetime.utcnow()
    db.commit()
