# TaskPilot

TaskPilot is a **local-first task scheduler**. You plan your day, schedule work ahead, and track your progress. Everything runs on your own machine: a FastAPI engine, a React interface and a single SQLite database file. There are no accounts and no cloud, and nothing leaves your computer.

![TaskPilot](TaskPilot-Demo/thumbnail.png)

## Features

| Area | What you can do |
| --- | --- |
| **Dashboard** | See any day at a glance: scheduled, pending and completed counts plus a completion rate. Search by title, filter by priority and status, and jump to any date. |
| **Tasks** | Create, edit, complete and delete tasks. Each task has a title, description, category (Work, Personal, Health, Design), date, start and end time, priority (low, medium, high), repeat rule (once, daily, weekly) and a colour. |
| **Upcoming** | See everything after today grouped by day, with totals for tasks ahead and time blocked out. Add a task straight into any day. |
| **Calendar** | Plan in a month grid with task markers. Pick a day to see its schedule in a side panel. |
| **Analytics** | Track focus hours, high-priority progress, velocity, a productivity trend (7 days, 30 days or 12 months), a scheduling-streak heatmap and a breakdown by category. |
| **Reminders** | Get desktop notifications the moment a task is due to start. |
| **Data** | Export all tasks to a JSON backup, and restore from one. |
| **Themes** | Choose Nocturne (blue slate), Sandstone (light) or Crimson (black and red). |
| **Anywhere on your network** | Open it from your phone on the same Wi-Fi. The layout adapts to small screens. |

A 22-second preview and screenshots are in [`TaskPilot-Demo/`](TaskPilot-Demo/).

---

## How it fits together

```
 Browser / app window ──HTTP──▶ FastAPI engine (uvicorn) ──SQLAlchemy──▶ SQLite: backend/tasks.db
   React + Vite UI              serves /api/* and the built UI
   (frontend/dist)              on http://127.0.0.1:8000
```

| Layer | Stack | Location |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion | `frontend/` |
| Backend | FastAPI, Uvicorn, SQLAlchemy 2, Pydantic | `backend/app/` |
| Database | SQLite (one file) | `backend/tasks.db` |
| Desktop launcher | PowerShell + shortcuts (Windows) | `desktop/` |

**One server, one port.** After the frontend is built, FastAPI serves both the API and the interface at `http://127.0.0.1:8000`. During development, a Vite dev server on port `3000` adds hot reload and forwards `/api` to port `8000`.

```
personal-task-scheduler/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app; also serves frontend/dist
│   │   ├── core/database.py     # Database connection (SQLALCHEMY_DATABASE_URL)
│   │   ├── models/task.py       # The `tasks` table
│   │   ├── schemas/task.py      # Request/response validation
│   │   ├── crud/task.py         # Database queries
│   │   └── api/endpoints/tasks.py
│   ├── requirements.txt
│   └── tasks.db                 # Your data (created automatically)
├── frontend/                    # React app (src/, public/, vite.config.ts)
├── desktop/                     # Windows launcher, shortcuts, rebuild script
├── TaskPilot-Demo/              # Preview video, thumbnail, screenshots
└── start-app.bat                # Starts the desktop app
```

---

## Prerequisites

| Tool | Version | Check with |
| --- | --- | --- |
| [Python](https://www.python.org/downloads/) | 3.10 or newer (tick **Add python.exe to PATH** on Windows) | `python --version` |
| [Node.js](https://nodejs.org/) | 18 or newer (includes npm) | `node --version` |
| Git (optional) | any | `git --version` |
| SQLite CLI (optional) | 3.x, only for running the SQL below by hand | `sqlite3 --version` |

You do **not** need to install a database server. SQLite is built into Python.

---

## Quick start (Windows)

From the project folder:

```bash
desktop\rebuild.bat
```

This one script:
1. creates a virtual environment in `backend\.venv`
2. installs the Python packages
3. installs the Node packages
4. builds the interface into `frontend\dist`

Then start the app:

```bash
start-app.bat
```

The launcher starts the engine, waits until it is ready, and opens TaskPilot in its own window. The database is created automatically the first time.

To get **Desktop** and **Start Menu** shortcuts (optional; add `-StartWithWindows` to launch at login):

```bash
powershell -ExecutionPolicy Bypass -File desktop\Install-TaskPilot.ps1
```

For more about the launcher, logs and troubleshooting, see [`desktop/README.md`](desktop/README.md).

---

## Manual setup (any OS)

Use these steps on macOS or Linux, or if you want to see each step.

### 1. Get the code

```bash
git clone <your-repo-url> personal-task-scheduler
cd personal-task-scheduler
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

Windows (PowerShell):

```bash
.venv\Scripts\Activate.ps1
```

macOS or Linux:

```bash
source .venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

### 3. Build the frontend

```bash
cd ../frontend
npm install
npm run build
```

This creates `frontend/dist`, which the backend serves.

### 4. Run it

The backend **must be started from inside `backend/`**. The reason is explained in the next section.

```bash
cd ../backend
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open **http://127.0.0.1:8000**. Check that the engine is up at http://127.0.0.1:8000/api/health:

```json
{"status": "operational", "engine": "sqlite"}
```

Interactive API docs are at http://127.0.0.1:8000/docs.

### 5. (Optional) Development mode with hot reload

Leave the backend running, then in a second terminal:

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000**. UI changes reload instantly, and API calls go through to port 8000. When you are done, run `npm run build` (or `desktop\rebuild.bat`) so the normal app picks up your changes.

### 6. (Optional) Use it from your phone

Start the backend with `--host 0.0.0.0`. Then open `http://<your-pc-ip>:8000` on a device on the same Wi-Fi. Find the IP with `ipconfig` on Windows or `ip addr` on Linux. Allow Python through the firewall if asked.

---

## Connecting to the database

### Where the connection is configured

The connection lives in [`backend/app/core/database.py`](backend/app/core/database.py):

```python
SQLALCHEMY_DATABASE_URL = "sqlite:///./tasks.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
```

- `sqlite:///./tasks.db` is a **relative** path. It points to `tasks.db` in whatever directory the server was **started from**. That's why the backend is always started from `backend/`. Starting it anywhere else quietly creates a new, empty database there.
- To use a fixed location, use an absolute path. Note the **four** slashes:
  ```python
  SQLALCHEMY_DATABASE_URL = "sqlite:////home/you/taskpilot/tasks.db"   # macOS / Linux
  SQLALCHEMY_DATABASE_URL = "sqlite:///D:/taskpilot/tasks.db"          # Windows
  ```
- `check_same_thread=False` is required for SQLite, because FastAPI handles requests on several threads.

### How the database gets created

You don't have to create it. When the engine starts, `main.py` runs:

```python
Base.metadata.create_all(bind=engine)
```

This creates `tasks.db` and the `tasks` table if they don't exist. It never changes or deletes existing data.

### Opening the database yourself

With the SQLite CLI:

```bash
sqlite3 backend/tasks.db
```

Inside the `sqlite3` prompt:

```sql
.tables
.schema tasks
SELECT id, title, date, start_time, priority, is_completed FROM tasks ORDER BY date DESC LIMIT 10;
```

Without the CLI, Python's built-in `sqlite3` module works too:

```bash
python -c "import sqlite3; c = sqlite3.connect('backend/tasks.db'); print(c.execute('SELECT COUNT(*) FROM tasks').fetchone())"
```

GUI tools such as [DB Browser for SQLite](https://sqlitebrowser.org/) or the VS Code *SQLite Viewer* extension can also open `backend/tasks.db`.

> Close any tool that has the file open for writing before you start TaskPilot. SQLite allows only one writer at a time.

---

## Creating the database with SQL

Use this to create `tasks.db` by hand, for example to inspect it before first launch or to prepare a database somewhere else. This SQL matches exactly what the app creates.

```bash
cd backend
sqlite3 tasks.db
```

Then run:

```sql
-- TaskPilot schema (SQLite)
CREATE TABLE IF NOT EXISTS tasks (
    id            INTEGER     NOT NULL,
    title         VARCHAR     NOT NULL,
    description   VARCHAR,
    category      VARCHAR,
    priority      VARCHAR(6)  NOT NULL,          -- 'LOW' | 'MEDIUM' | 'HIGH'
    date          DATETIME    NOT NULL,          -- 'YYYY-MM-DD 00:00:00.000000'
    start_time    TIME        NOT NULL,          -- 'HH:MM:SS.000000'
    end_time      TIME        NOT NULL,
    is_completed  BOOLEAN     NOT NULL,          -- 0 | 1
    reminder      BOOLEAN     NOT NULL,          -- 0 | 1
    repeat        VARCHAR(7)  NOT NULL,          -- 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
    color         VARCHAR     NOT NULL,          -- hex, e.g. '#3b82f6'
    created_at    DATETIME    NOT NULL,
    updated_at    DATETIME    NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_tasks_id           ON tasks (id);
CREATE INDEX IF NOT EXISTS ix_tasks_title        ON tasks (title);
CREATE INDEX IF NOT EXISTS ix_tasks_category     ON tasks (category);
CREATE INDEX IF NOT EXISTS ix_tasks_date         ON tasks (date);
CREATE INDEX IF NOT EXISTS ix_tasks_is_completed ON tasks (is_completed);
```

### Value formats (important when writing SQL by hand)

SQLAlchemy stores some values in particular formats. Rows that don't follow these will fail to load in the app.

| Column | Stored as | Example |
| --- | --- | --- |
| `priority` | Enum **name**, uppercase | `'HIGH'` (not `'high'`) |
| `repeat` | Enum **name**, uppercase | `'WEEKLY'` |
| `date` | Datetime at midnight, with microseconds | `'2026-10-11 00:00:00.000000'` |
| `start_time`, `end_time` | Time with microseconds | `'14:00:00.000000'` |
| `is_completed`, `reminder` | Integer | `0` or `1` |

The API itself uses lowercase (`"priority": "high"`, `"repeat": "weekly"`) and `HH:MM` times. SQLAlchemy converts between the two.

### Optional: sample data

```sql
INSERT INTO tasks (title, description, category, priority, date, start_time, end_time,
                   is_completed, reminder, repeat, color, created_at, updated_at)
VALUES
  ('Morning run', '5 km easy pace', 'Health', 'MEDIUM',
   date('now','localtime') || ' 00:00:00.000000', '07:00:00.000000', '07:45:00.000000',
   1, 0, 'DAILY', '#10b981', datetime('now') || '.000000', datetime('now') || '.000000'),
  ('Finalize Q4 roadmap deck', 'Incorporate leadership feedback', 'Work', 'HIGH',
   date('now','localtime') || ' 00:00:00.000000', '09:00:00.000000', '10:30:00.000000',
   0, 0, 'NONE', '#3b82f6', datetime('now') || '.000000', datetime('now') || '.000000'),
  ('Design review: onboarding flow', 'New sign-up screens', 'Design', 'HIGH',
   date('now','localtime','+1 day') || ' 00:00:00.000000', '14:00:00.000000', '15:30:00.000000',
   0, 0, 'NONE', '#8b5cf6', datetime('now') || '.000000', datetime('now') || '.000000'),
  ('Call with family', 'Weekly catch-up', 'Personal', 'MEDIUM',
   date('now','localtime','+2 day') || ' 00:00:00.000000', '19:00:00.000000', '19:45:00.000000',
   0, 0, 'WEEKLY', '#f59e0b', datetime('now') || '.000000', datetime('now') || '.000000');
```

### Useful queries

```sql
-- Today's tasks in time order
SELECT title, start_time, end_time, priority, is_completed
FROM tasks
WHERE date(date) = date('now','localtime')
ORDER BY start_time;

-- Completion rate per day, last 7 days
SELECT date(date) AS day,
       COUNT(*) AS scheduled,
       SUM(is_completed) AS done,
       ROUND(100.0 * SUM(is_completed) / COUNT(*)) AS pct
FROM tasks
WHERE date(date) BETWEEN date('now','localtime','-6 day') AND date('now','localtime')
GROUP BY day ORDER BY day;

-- Tasks per category
SELECT category, COUNT(*) AS total FROM tasks GROUP BY category ORDER BY total DESC;

-- Mark a task done
UPDATE tasks SET is_completed = 1, updated_at = datetime('now') || '.000000' WHERE id = 42;
```

Leave the `sqlite3` prompt with `.quit`.

---

## API reference

Base URL: `http://127.0.0.1:8000`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Engine status |
| `GET` | `/api/tasks` | List tasks (oldest first) |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/{id}` | Update any fields, including `is_completed` |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

Example: create a task.

```bash
curl -X POST http://127.0.0.1:8000/api/tasks -H "Content-Type: application/json" -d "{\"title\":\"Write report\",\"category\":\"Work\",\"priority\":\"high\",\"date\":\"2026-10-12\",\"start_time\":\"10:00\",\"end_time\":\"11:00\",\"repeat\":\"none\",\"color\":\"#e63946\"}"
```

> **Known limitation:** `GET /api/tasks` returns at most **100** tasks, oldest first (`limit=100` in `backend/app/crud/task.py`). Once you have more than 100 tasks, the newest ones won't appear in the app until that limit is raised.

---

## Backup and restore

- **From the app:** *Settings → Data → Export backup* saves every task as JSON. *Restore from backup* adds tasks from such a file.
- **The whole database:** stop TaskPilot, then copy `backend/tasks.db` somewhere safe. To restore, put the copy back.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| App shows **"Backend connection offline"** | Make sure the engine is running and http://127.0.0.1:8000/api/health responds. |
| **Tasks are missing** or the app is empty | The engine was probably started outside `backend/` and created a new empty `tasks.db`. Stop it and start it from `backend/`. |
| **Port 8000 is already in use** | Stop the other process, or run on another port (`--port 8123`). In dev mode, also change the proxy `target` in `frontend/vite.config.ts`. |
| **"Python was not found"** | Install Python 3.10+ with *Add to PATH* ticked, then rerun `desktop\rebuild.bat`. |
| **Blank or outdated page** after a rebuild | Reload once. An old service worker clears itself on first load. |
| **No reminders** | Allow notifications for the site in the browser (*Settings → Notifications* in TaskPilot explains a blocked state). |

More launcher-specific help is in [`desktop/README.md`](desktop/README.md).
