<#
    Removes the TaskPilot shortcuts and stops the background engine.
    Your tasks are untouched - they live in backend\tasks.db.

    Usage:
        powershell -ExecutionPolicy Bypass -File .\Uninstall-TaskPilot.ps1
#>

$ErrorActionPreference = 'Stop'

$paths = @(
    (Join-Path ([Environment]::GetFolderPath('Desktop')) 'TaskPilot.lnk'),
    (Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs\TaskPilot.lnk'),
    (Join-Path ([Environment]::GetFolderPath('Startup')) 'TaskPilot.lnk')
)

Write-Host ''
foreach ($p in $paths) {
    if (Test-Path $p) {
        Remove-Item $p -Force
        Write-Host "  removed  $p"
    }
}

# Stop whatever is holding port 8000.
$conns = Get-NetTCPConnection -State Listen -LocalPort 8000 -ErrorAction SilentlyContinue
if ($conns) {
    $conns | ForEach-Object {
        try {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction Stop
            Write-Host "  stopped  engine (PID $($_.OwningProcess))"
        } catch {}
    }
}

Write-Host ''
Write-Host 'TaskPilot shortcuts removed. Your tasks remain in backend\tasks.db.' -ForegroundColor Green
Write-Host ''
