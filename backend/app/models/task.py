import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Time
from app.core.database import Base

class PriorityEnum(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class RepeatEnum(str, enum.Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    category = Column(String, default="General", index=True)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.MEDIUM, nullable=False)
    
    # Scheduling
    date = Column(DateTime, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # State & Config
    is_completed = Column(Boolean, default=False, nullable=False, index=True)
    reminder = Column(Boolean, default=False, nullable=False)
    repeat = Column(Enum(RepeatEnum), default=RepeatEnum.NONE, nullable=False)
    color = Column(String, default="#3b82f6", nullable=False) # Default tailwind blue-500
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)