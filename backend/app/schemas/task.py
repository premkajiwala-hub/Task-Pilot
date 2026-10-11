from pydantic import BaseModel, Field
from datetime import datetime
# Aliased on purpose. Fields below are *named* `date`, `start_time` and
# `end_time`, and in an annotated assignment with a default
# (`date: Optional[date] = None`) CPython performs the assignment before it
# evaluates the annotation. The class-local name `date` is therefore already
# bound to None by the time `Optional[date]` is resolved, which silently
# collapses the field type to NoneType and makes every update carrying a real
# date fail validation with "Input should be None". Aliasing the imports keeps
# the type names unshadowed; the field names — and so the JSON contract — are
# unchanged.
from datetime import date as DateType, time as TimeType
from typing import Optional
from app.models.task import PriorityEnum, RepeatEnum

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    category: str = "General"
    priority: PriorityEnum = PriorityEnum.MEDIUM
    date: DateType
    start_time: TimeType
    end_time: TimeType
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
    date: Optional[DateType] = None
    start_time: Optional[TimeType] = None
    end_time: Optional[TimeType] = None
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
