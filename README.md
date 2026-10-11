# TaskPilot

TaskPilot is a **local-first task scheduler** for planning your day, scheduling work ahead, and seeing how consistently you follow through. It runs entirely on your own computer, with no accounts and no cloud. Your tasks are kept in a single file on your machine and never leave it.

![TaskPilot](TaskPilot-Demo/thumbnail.png)

## Features

- **Dashboard.** See any day at a glance: scheduled, pending and completed tasks, plus your completion rate. Search by title, filter by priority or status, and jump to any date.
- **Tasks.** Create, edit, complete and delete tasks. Each task has a title, description, category, date, start and end time, priority, repeat rule (once, daily or weekly) and a colour.
- **Upcoming.** Everything after today, grouped by day, with the total time you've blocked out. Add a task straight into any day.
- **Calendar.** Plan across the month with task markers on each day. Pick a day to see its full schedule.
- **Analytics.** Focus hours, high-priority progress, a productivity trend over 7 days, 30 days or 12 months, a scheduling-streak heatmap, and a breakdown by category.
- **Desktop reminders.** Get a notification the moment a task is due to start.
- **Backup and restore.** Export every task to a JSON file and bring it back any time.
- **Three themes.** Nocturne, Sandstone and Crimson.
- **Works on your phone.** Open it from any device on the same Wi-Fi; the layout adapts to small screens.

---

## Local setup

### Prerequisites

- [Python](https://www.python.org/downloads/) 3.10 or newer. On Windows, tick **Add python.exe to PATH** during install.
- [Node.js](https://nodejs.org/) 18 or newer.

### Option A: Windows, one step

From the project folder, install everything and build the app:

```bash
desktop\rebuild.bat
```

Then start TaskPilot. It opens in its own window:

```bash
start-app.bat
```

Optionally, add Desktop and Start Menu shortcuts:

```bash
powershell -ExecutionPolicy Bypass -File desktop\Install-TaskPilot.ps1
```

### Option B: Any OS, step by step

**1. Get the code**

```bash
git clone <your-repo-url> personal-task-scheduler
cd personal-task-scheduler
```

**2. Install the backend**

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

**3. Build the interface**

```bash
cd ../frontend
npm install
npm run build
```

**4. Start TaskPilot**

Always start the server from inside the `backend` folder, so it uses the right database file:

```bash
cd ../backend
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open **http://127.0.0.1:8000** in your browser.

To use TaskPilot from your phone, start the server with `--host 0.0.0.0` instead. Then open `http://<your-computer-ip>:8000` on a device on the same Wi-Fi.

**For development (optional)**

Keep the server running, then in a second terminal:

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000**. Your changes reload instantly.

---

## Connecting to the database

TaskPilot stores everything in a single SQLite file, `backend/tasks.db`. You don't need to install or run a database server. The file and its table are **created automatically** the first time TaskPilot starts.

### Connection setting

The connection is set in `backend/app/core/database.py`:

```python
SQLALCHEMY_DATABASE_URL = "sqlite:///./tasks.db"
```

This path is relative to the folder the server is started from, which is why the server is started inside `backend`. To keep the database somewhere else, use an absolute path:

```python
SQLALCHEMY_DATABASE_URL = "sqlite:////home/you/taskpilot/tasks.db"   # macOS / Linux
SQLALCHEMY_DATABASE_URL = "sqlite:///D:/taskpilot/tasks.db"          # Windows
```

### Opening the database

With the [SQLite command-line tool](https://sqlite.org/download.html):

```bash
sqlite3 backend/tasks.db
```

Inside the `sqlite3` prompt:

```sql
.tables
.schema tasks
SELECT id, title, date, start_time, priority, is_completed FROM tasks ORDER BY date DESC LIMIT 10;
```

Exit with `.quit`. Graphical tools such as [DB Browser for SQLite](https://sqlitebrowser.org/) can also open `backend/tasks.db`.

### Creating the database manually (optional)

TaskPilot creates the database for you. If you'd rather create it yourself, run this from the `backend` folder:

```bash
sqlite3 tasks.db
```

Then run this SQL. It matches exactly what TaskPilot creates:

```sql
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
    color         VARCHAR     NOT NULL,          -- e.g. '#3b82f6'
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

When adding rows by hand, follow the formats in the comments above:
- uppercase names for `priority` and `repeat`
- dates and times with microseconds
- `0` or `1` for the true/false columns

### Sample data (optional)

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
```

### Backing up your data

In the app, use **Settings → Data → Export backup**. Or close TaskPilot and copy `backend/tasks.db` somewhere safe.
