from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.database import engine, Base
from app.api.endpoints.tasks import router as tasks_router

# Core database migration setup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TaskPilot Core Engine", version="1.1.0")

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


# --------------------------------------------------------------------------
# Static frontend
#
# When a production build exists, this process serves the UI as well as the
# API, so the whole app lives on one origin and one port. That removes the
# separate dev server from the normal run path, and with it the cross-origin
# quirks: relative /api calls just work whether the app is opened at
# 127.0.0.1, localhost, or the machine's LAN address from a phone.
#
# Mounted last so every /api route above still wins. Absent a build, the API
# runs on its own exactly as before and the dev server supplies the UI.
# --------------------------------------------------------------------------

DIST_DIR = Path(__file__).resolve().parents[2] / "frontend" / "dist"

if DIST_DIR.is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=DIST_DIR / "assets"),
        name="assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        """Serve a real file when one exists, otherwise the SPA entry point."""
        candidate = (DIST_DIR / full_path).resolve()

        # Keep traversal inside the build directory.
        if (
            full_path
            and DIST_DIR in candidate.parents
            and candidate.is_file()
        ):
            return FileResponse(candidate)

        return FileResponse(DIST_DIR / "index.html")
