from typing import Optional, List
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    boards: List["Board"] = []

    class Config:
        orm_mode = True


class BoardBase(BaseModel):
    name: str


class BoardCreate(BoardBase):
    pass


class BoardUpdate(BoardBase):
    name: Optional[str] = None


class Board(BoardBase):
    id: int
    owner_id: int
    created_at: datetime
    projects: List["Project"] = []

    class Config:
        orm_mode = True


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    board_id: int  # Add board_id


class ProjectUpdate(ProjectBase):
    name: Optional[str] = None
    description: Optional[str] = None


class Project(ProjectBase):
    id: int
    owner_id: int
    board_id: int  # Add board_id
    created_at: datetime
    tasks: List["Task"] = []

    class Config:
        orm_mode = True


class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_completed: bool = False
    priority: Priority = Priority.MEDIUM  # Добавлено поле priority


class TaskCreate(TaskBase):
    pass


class TaskUpdate(TaskBase):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    priority: Optional[Priority] = None  # Добавлено поле priority


class Task(TaskBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        orm_mode = True