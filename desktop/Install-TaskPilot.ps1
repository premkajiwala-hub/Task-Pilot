<#
    Creates Desktop and Start Menu shortcuts for TaskPilot.

    Both point at TaskPilot.vbs so launching never flashes a console window,
    and both carry the generated multi-resolution icon.

    Optional -StartWithWindows adds a Startup-folder shortcut so the engine is
    already running when you log in. It is off by default: enabling it changes
    what your machine does at login, which should be a deliberate choice.

    Usage:
        powershell -ExecutionPolicy Bypass -File .\Install-TaskPilot.ps1
        powershell -ExecutionPolicy Bypass -File .\Install-TaskPilot.ps1 -StartWithWindows
#>

[CmdletBinding()]
param(
    [switch]$StartWithWindows
)

$ErrorActionPreference = 'Stop'

$here     = Split-Path -Parent $MyInvocation.MyCommand.Path
$target   = Join-Path $here 'TaskPilot.vbs'
$icon     = Join-Path $here 'taskpilot.ico'
$workDir  = Split-Path -Parent $here

foreach ($required in @($target, $icon)) {
    if (-not (Test-Path $required)) {
        throw "Missing required file: $required"
    }
}

function New-TaskPilotShortcut {
    param([string]$Path, [string]$Description)

    $parent = Split-Path -Parent $Path
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }

    $shell = New-Object -ComObject WScript.Shell
    $lnk = $shell.CreateShortcut($Path)
    $lnk.TargetPath       = $target
    $lnk.WorkingDirectory = $workDir
    $lnk.IconLocation     = "$icon,0"
    $lnk.Description      = $Description
    $lnk.WindowStyle      = 1
    $lnk.Save()

    Write-Host "  created  $Path"
}

Write-Host ''
Write-Host 'Installing TaskPilot shortcuts' -ForegroundColor Cyan

$desktop   = [Environment]::GetFolderPath('Desktop')
$startMenu = Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs'

New-TaskPilotShortcut -Path (Join-Path $desktop   'TaskPilot.lnk') -Description 'TaskPilot - local task scheduler'
New-TaskPilotShortcut -Path (Join-Path $startMenu 'TaskPilot.lnk') -Description 'TaskPilot - local task scheduler'

$startupLnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'TaskPilot.lnk'

if ($StartWithWindows) {
    New-TaskPilotShortcut -Path $startupLnk -Description 'Start TaskPilot at login'
    Write-Host ''
    Write-Host 'TaskPilot will now start automatically when you log in.' -ForegroundColor Green
} else {
    if (Test-Path $startupLnk) {
        Remove-Item $startupLnk -Force
        Write-Host "  removed  $startupLnk"
    }
    Write-Host ''
    Write-Host 'Not set to start at login. Re-run with -StartWithWindows to enable it.' -ForegroundColor DarkGray
}

Write-Host ''
Write-Host 'Done. Launch TaskPilot from the desktop icon or the Start menu.' -ForegroundColor Green
Write-Host ''
