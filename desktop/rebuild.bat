@echo off
setlocal EnableExtensions

rem ===========================================================
rem  Rebuild / set up TaskPilot.
rem
rem  Creates an isolated Python virtual environment for the
rem  backend, installs both Python and Node dependencies, and
rem  compiles the UI into frontend\dist (which the backend
rem  serves). Safe to run repeatedly.
rem
rem  The launcher prefers the venv but falls back to global
rem  Python, so this never has to succeed for the app to run -
rem  but a venv makes startup independent of whatever global
rem  packages happen to be installed later.
rem ===========================================================

set "ROOT=%~dp0.."
set "VENV=%ROOT%\backend\.venv"

echo.
echo [1/4] Python virtual environment...
if exist "%VENV%\Scripts\python.exe" (
    echo    already exists, reusing.
) else (
    python -m venv "%VENV%" || py -3 -m venv "%VENV%"
    if not exist "%VENV%\Scripts\python.exe" (
        echo    could not create a venv; the launcher will use global Python instead.
    )
)

echo [2/4] Python dependencies...
if exist "%VENV%\Scripts\python.exe" (
    "%VENV%\Scripts\python.exe" -m pip install --quiet --disable-pip-version-check --upgrade pip
    "%VENV%\Scripts\python.exe" -m pip install --quiet --disable-pip-version-check -r "%ROOT%\backend\requirements.txt" || (
        echo    venv install failed; falling back to global Python.
        python -m pip install --quiet --disable-pip-version-check -r "%ROOT%\backend\requirements.txt"
    )
) else (
    python -m pip install --quiet --disable-pip-version-check -r "%ROOT%\backend\requirements.txt" || (
        echo    pip install failed.
        exit /b 1
    )
)

echo [3/4] Node dependencies...
pushd "%ROOT%\frontend"
if not exist "node_modules" (
    call npm install || (echo    npm install failed. & popd & exit /b 1)
) else (
    echo    already installed, skipping.
)

echo [4/4] Building the interface...
call npm run build || (echo    Build failed. & popd & exit /b 1)
popd

echo.
echo Done. Launch TaskPilot from the desktop shortcut.
exit /b 0
