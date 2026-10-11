<#
    TaskPilot launcher — single source of truth.

    Replaces the old batch launcher, which had several cold-boot failure modes
    that only showed up after a restart:

      * It found Python with `where pythonw` — a PATH lookup that is empty or
        slow inside the hidden console the shortcut spawns at boot.
      * The engine ran under pythonw with its output going nowhere, so a cold
        crash (locked db, slow import, AV scan) was invisible and unrecoverable.
      * Readiness was a fixed ~30s poll with a cold `Test-NetConnection`
        (~3s just to load its module) and cold PowerShell startup stacked in
        front of it; if the first Python import ran long, the poll gave up and
        the browser never opened.

    This script fixes all of that:

      * Resolves an interpreter by absolute path (venv first), never via PATH.
      * Starts the engine detached, with stdout/stderr captured to a log.
      * Waits on the real /api/health endpoint with a generous timeout AND
        bails out early with the log if the process dies — so it fails fast
        with a reason instead of a blind wait.
      * Opens the app window only after the backend answers 200.
      * Is idempotent: a healthy server is reused, never double-started.

    Run headless via TaskPilot.vbs (no console). Safe to run directly too.
#>

[CmdletBinding()]
param(
    [int]$Port = 8000,
    [int]$TimeoutSeconds = 90
)

$ErrorActionPreference = 'Stop'

$Here     = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root     = Split-Path -Parent $Here
$Backend  = Join-Path $Root 'backend'
$DistIndex = Join-Path $Root 'frontend\dist\index.html'
$LogDir   = Join-Path $Here 'logs'
$AppUrl   = "http://127.0.0.1:$Port"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }
$RunLog    = Join-Path $LogDir 'launch.log'
$EngineOut = Join-Path $LogDir 'engine.out.log'
$EngineErr = Join-Path $LogDir 'engine.err.log'

function Write-Log {
    param([string]$Message)
    $line = "{0}  {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Add-Content -Path $RunLog -Value $line -Encoding UTF8
}

function Show-Error {
    param([string]$Message)
    Write-Log "FAIL: $Message"
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $full = "$Message`n`nDetails were written to:`n$LogDir"
        [void][System.Windows.Forms.MessageBox]::Show(
            $full, 'TaskPilot', 'OK', 'Error')
    } catch { }
}

function Test-Health {
    param([int]$TimeoutSec = 2)
    try {
        $r = Invoke-WebRequest -Uri "$AppUrl/api/health" -TimeoutSec $TimeoutSec -UseBasicParsing
        return $r.StatusCode -eq 200
    } catch {
        return $false
    }
}

# --- Resolve a Python interpreter by absolute path ----------------------
# Preference order:
#   1. the project venv        (isolated, guaranteed deps)
#   2. pythonw/python on PATH   (resolved to a full path while we can see it)
#   3. the Windows 'py' launcher
#   4. a couple of well-known install locations
# We capture ABSOLUTE paths so nothing later depends on PATH being populated
# in whatever context the shortcut runs.
function Resolve-Python {
    $venvW = Join-Path $Backend '.venv\Scripts\pythonw.exe'
    $venv  = Join-Path $Backend '.venv\Scripts\python.exe'
    if (Test-Path $venvW) { return @{ Exe = $venvW; Kind = 'venv (windowless)' } }
    if (Test-Path $venv)  { return @{ Exe = $venv;  Kind = 'venv' } }

    foreach ($name in 'pythonw.exe', 'python.exe') {
        $cmd = Get-Command $name -ErrorAction SilentlyContinue
        if ($cmd) { return @{ Exe = $cmd.Source; Kind = "PATH ($name)" } }
    }

    $py = Get-Command 'py.exe' -ErrorAction SilentlyContinue
    if ($py) {
        # Ask the launcher for the actual interpreter path.
        try {
            $resolved = & $py.Source -3 -c "import sys,os;print(os.path.join(os.path.dirname(sys.executable),'pythonw.exe'))" 2>$null
            if ($resolved -and (Test-Path $resolved)) { return @{ Exe = $resolved; Kind = 'py -3' } }
        } catch { }
    }

    foreach ($guess in @(
        "$env:LocalAppData\Programs\Python\Python314\pythonw.exe",
        "$env:LocalAppData\Programs\Python\Python313\pythonw.exe",
        "$env:LocalAppData\Programs\Python\Python312\pythonw.exe",
        'C:\Python314\pythonw.exe',
        'C:\Python313\pythonw.exe',
        'C:\Python312\pythonw.exe'
    )) {
        if (Test-Path $guess) { return @{ Exe = $guess; Kind = 'known location' } }
    }

    return $null
}

function Find-Browser {
    foreach ($b in @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
    )) {
        if (Test-Path $b) { return $b }
    }
    return $null
}

function Open-AppWindow {
    $browser = Find-Browser
    if ($browser) {
        Write-Log "Opening app window via $browser"
        Start-Process -FilePath $browser -ArgumentList "--app=$AppUrl", '--window-size=1440,900'
    } else {
        Write-Log 'No Chromium browser found; using default handler.'
        Start-Process $AppUrl
    }
}

# ------------------------------------------------------------------------
try {
    Write-Log "=== launch requested (port $Port) ==="

    # 1. Already up? Reuse it and just open the window.
    if (Test-Health) {
        Write-Log 'Engine already healthy; reusing it.'
        Open-AppWindow
        exit 0
    }

    # 2. The UI must be built before the backend can serve it.
    if (-not (Test-Path $DistIndex)) {
        Write-Log 'No production build found; running first-time setup (visible).'
        $rebuild = Join-Path $Here 'rebuild.bat'
        Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "`"$rebuild`"" -Wait
        if (-not (Test-Path $DistIndex)) {
            Show-Error "TaskPilot could not build its interface. Run desktop\rebuild.bat to see the error."
            exit 1
        }
    }

    # 3. Resolve the interpreter.
    $python = Resolve-Python
    if (-not $python) {
        Show-Error "Python was not found. Install Python 3.10+ from python.org (tick 'Add python.exe to PATH'), then try again."
        exit 1
    }
    Write-Log "Interpreter: $($python.Exe)  [$($python.Kind)]"

    # 4. Start the engine detached, capturing output so a cold crash is visible.
    #    Fresh logs each launch to keep them small and relevant.
    Set-Content -Path $EngineOut -Value '' -Encoding UTF8
    Set-Content -Path $EngineErr -Value '' -Encoding UTF8

    $proc = Start-Process -FilePath $python.Exe `
        -ArgumentList '-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', "$Port" `
        -WorkingDirectory $Backend `
        -WindowStyle Hidden `
        -RedirectStandardOutput $EngineOut `
        -RedirectStandardError $EngineErr `
        -PassThru
    Write-Log "Engine starting (PID $($proc.Id)); waiting up to ${TimeoutSeconds}s for health."

    # 5. Wait for real readiness. Poll health, but also watch the process:
    #    if it exits, stop immediately and surface the reason.
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $ready = $false
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        if ($proc.HasExited) {
            $tail = (Get-Content $EngineErr -Tail 15 -ErrorAction SilentlyContinue) -join "`n"
            Show-Error "The TaskPilot engine stopped during startup (exit $($proc.ExitCode)).`n`n$tail"
            exit 1
        }
        if (Test-Health) { $ready = $true; break }
        Start-Sleep -Milliseconds 500
    }
    $sw.Stop()

    if (-not $ready) {
        $tail = (Get-Content $EngineErr -Tail 15 -ErrorAction SilentlyContinue) -join "`n"
        Show-Error "TaskPilot's engine did not become ready within ${TimeoutSeconds}s.`n`n$tail"
        exit 1
    }

    Write-Log ("Engine healthy after {0:N1}s." -f $sw.Elapsed.TotalSeconds)

    # 6. Only now open the window.
    Open-AppWindow
    Write-Log '=== launch complete ==='
    exit 0
}
catch {
    Show-Error "Unexpected launch error: $($_.Exception.Message)"
    exit 1
}
