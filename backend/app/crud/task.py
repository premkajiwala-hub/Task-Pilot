from sqlalchemy.orm import Session
from datetime import datetime
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

def get_tasks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Task).order_by(Task.date.asc(), Task.start_time.asc()).offset(skip).limit(limit).all()

def create_task(db: Session, task_data: TaskCreate):
    # Convert date to datetime object for SQLite storage safety
    dt_date = datetime.combine(task_data.date, datetime.min.time())
    
    db_task = Task(
        title=task_data.title,
        description=task_data.description,
        category=task_data.category,
        priority=task_data.priority,
        date=dt_date,
        start_time=task_data.start_time,
        end_time=task_data.end_time,
        reminder=task_data.reminder,
        repeat=task_data.repeat,
        color=task_data.color,
        is_completed=False
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task_data: TaskUpdate):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        return None
    
    update_dict = task_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if key == 'date' and value is not None:
            value = datetime.combine(value, datetime.min.time())
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False