@echo off
title ChronosLocal Unified Launch System
echo ===================================================
echo   LAUNCHING CHRONOSLOCAL TASK SCHEDULER ENGINE
echo ===================================================

:: 1. Boot the Backend API in a separate window
echo [SYSTEM] Spinning up SQLite Database ^& FastAPI Engine...
start "Chronos Backend Server" cmd /c "cd backend && python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"

:: 2. Wait 2 seconds to ensure the database engine binds to port 8000 safely
timeout /t 2 /nobreak >nul

:: 3. Launch the Frontend Dev Server and instruct Vite to open the browser automatically
echo [SYSTEM] Starting React ^& Vite UI Client Canvas...
cd frontend
npm run dev -- --open

echo ===================================================
echo   ChronosLocal is active. Close this window to exit.
echo ===================================================
pause