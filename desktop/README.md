# TaskPilot — desktop app

TaskPilot runs as a normal Windows application: one icon, its own window, no
terminal and no browser address bar.

## To open the app

Double-click the **TaskPilot** icon on your Desktop (or find *TaskPilot* in the
Start menu). That's the whole flow — it starts the backend, waits for it to be
ready, and opens the app window. Nothing else to run.

Equivalent entry points, if you prefer:

- `start-app.bat` in the project root — same thing.
- `desktop\TaskPilot.vbs` — what the shortcut actually runs (fully silent).
- `desktop\start-taskpilot.bat` — same, but shows a window with progress/errors.

## First-time install (once)

Run from this folder:

```bash
powershell -ExecutionPolicy Bypass -File .\Install-TaskPilot.ps1
```

That creates the **Desktop** and **Start Menu** shortcuts.

To also start it automatically at login:

```bash
powershell -ExecutionPolicy Bypass -File .\Install-TaskPilot.ps1 -StartWithWindows
```

Re-running without the switch removes the login entry again.

## How startup works

The launcher is a single PowerShell script, `launch.ps1`; everything else just
forwards to it. It:

1. **Reuses a running engine.** If the backend already answers, it skips
   straight to opening the window — running it twice never starts two servers.
2. **Finds Python by absolute path**, preferring the project's own virtual
   environment (`backend\.venv`) and falling back to a global install. It never
   depends on `PATH` being populated, which is what made the old launcher flaky
   right after a reboot.
3. **Starts the engine detached, with its output captured** to
   `desktop\logs\engine.*.log`. A cold-boot crash is now visible instead of
   silent.
4. **Waits for the real `/api/health` endpoint** (up to 90s) and watches the
   process while it waits — if the engine dies, it stops immediately and shows
   the actual error rather than hanging.
5. **Opens the app window only once the backend answers**, so the browser can
   never load before the API is ready.

| File | Role |
| --- | --- |
| `launch.ps1` | The launcher. All logic lives here. |
| `TaskPilot.vbs` | Runs `launch.ps1` completely hidden. The shortcuts point here. |
| `start-taskpilot.bat` | Same, but visible — handy for seeing errors. |
| `rebuild.bat` | Creates the venv, installs dependencies, rebuilds the UI. |
| `taskpilot.ico` | Multi-resolution icon (16→256px) from `frontend/public/logo.png`. |
| `Install-TaskPilot.ps1` / `Uninstall-TaskPilot.ps1` | Manage the shortcuts. |
| `logs/` | Launch and engine logs. Safe to delete. |

**One server, one port.** FastAPI serves both the API and the built interface,
so everything is at `http://127.0.0.1:8000`. There is no separate dev server in
the normal run path. The engine keeps running after you close the window, so
reopening is instant.

## Using it from your phone

The API and interface share one origin and the app uses relative URLs, so
nothing needs editing. On the same Wi-Fi:

```
http://<your-pc-ip>:8000
```

Find the IP with `ipconfig` (IPv4 Address). Allow Python through Windows
Firewall on private networks the first time if prompted.

## Changing the code

```bash
cd frontend
npm run dev
```

The dev server runs on `http://localhost:3000` with hot reload and proxies
`/api` to the backend on 8000, so the backend must be running too — the desktop
launcher provides it. When done, rebuild so the desktop app picks up the change:

```bash
desktop\rebuild.bat
```

## Troubleshooting

**It didn't open after a restart.** Open `desktop\logs\launch.log` and
`desktop\logs\engine.err.log` — the launcher records every step and captures the
engine's own error output, so the reason is in there. The most common cause is a
leftover process still holding port 8000 from before the restart; the launcher
now detects this and reports it. Reboot again, or stop whatever holds the port.

**The window is blank, or shows an old version.** This was a stale service
worker serving a dead precache. TaskPilot no longer precaches: the worker it
ships unregisters itself and clears its caches on first load. If you hit it,
reload once more, or DevTools → Application → Service Workers → Unregister.

**"Python was not found."** Install Python 3.10+ (tick *Add python.exe to PATH*),
then run `desktop\rebuild.bat` to create the virtual environment.

**Nothing happens when I double-click.** Run `desktop\start-taskpilot.bat`
directly — it shows the launcher's window and any error dialog.

**Port 8000 is taken.** Pass a different port: run
`powershell -ExecutionPolicy Bypass -File desktop\launch.ps1 -Port 8123`, and set
the matching `target` port in `frontend/vite.config.ts`.

## Your data

Everything lives in `backend/tasks.db`. Uninstalling never touches it.
Settings → Data → Export backup writes a JSON copy you can restore later.
