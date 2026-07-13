from pydantic import BaseModel, Field
from datetime import datetime, date, time
from typing import Optional
from app.models.task import PriorityEnum, RepeatEnum

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    category: str = "General"
    priority: PriorityEnum = PriorityEnum.MEDIUM
    date: date
    start_time: time
    end_time: time
    reminder: bool = False
    repeat: RepeatEnum = RepeatEnum.NONE
    color: str = "#3b82f6"

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_completed: Optional[bool] = None
    reminder: Optional[bool] = None
    repeat: Optional[RepeatEnum] = None
    color: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True