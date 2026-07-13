from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.crud import task as crud_task

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskResponse])
def read_tasks(db: Session = Depends(get_db)):
    return crud_task.get_tasks(db)

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_new_task(task: TaskCreate, db: Session = Depends(get_db)):
    return crud_task.create_task(db=db, task_data=task)

@router.put("/{task_id}", response_model=TaskResponse)
def update_existing_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db)):
    updated = crud_task.update_task(db=db, task_id=task_id, task_data=task)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_task(task_id: int, db: Session = Depends(get_db)):
    if not crud_task.delete_task(db=db, task_id=task_id):
        raise HTTPException(status_code=404, detail="Task not found")