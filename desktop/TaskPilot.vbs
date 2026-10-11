' TaskPilot silent launcher.
'
' The desktop and Start Menu shortcuts point here. This runs the PowerShell
' launcher completely hidden - no console window flashes on the way to the app,
' which matters most right after a reboot when the shortcut is clicked early.

Dim shell, here, cmd
Set shell = CreateObject("WScript.Shell")
here = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & here & "\launch.ps1"""

' 0 = hidden window, False = return immediately (don't block the shortcut).
shell.Run cmd, 0, False
