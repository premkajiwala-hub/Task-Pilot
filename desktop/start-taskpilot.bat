@echo off
rem ===========================================================
rem  TaskPilot launcher (compatibility wrapper)
rem
rem  The real logic lives in launch.ps1. This batch file exists
rem  only so the old entry point keeps working; it forwards to
rem  the PowerShell launcher and shows its window so anyone who
rem  runs the .bat directly can see progress and any error.
rem
rem  For a completely silent launch (the desktop shortcut path)
rem  use TaskPilot.vbs instead.
rem ===========================================================

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch.ps1"
exit /b %ERRORLEVEL%
