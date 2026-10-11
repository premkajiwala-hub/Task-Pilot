@echo off
rem ===========================================================
rem  TaskPilot
rem
rem  Superseded by the desktop app. This now just forwards to
rem  the same launcher the desktop icon uses, so the old habit
rem  keeps working.
rem
rem  There is no longer a separate dev server on port 3000:
rem  the backend serves the interface too, on one port.
rem  Everything lives at http://127.0.0.1:8000
rem
rem  For development with hot reload, see desktop\README or run:
rem      cd frontend && npm run dev
rem ===========================================================

start "" "%~dp0desktop\TaskPilot.vbs"
exit /b 0
