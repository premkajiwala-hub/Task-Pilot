from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api.endpoints.tasks import router as tasks_router

# Core database migration setup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ChronosLocal Core Engine", version="1.0.0")

# Permit strict decoupled routing profiles for cross-port LAN access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks_router)

@app.get("/api/health")
def health_check():
    return {"status": "operational", "engine": "sqlite"}