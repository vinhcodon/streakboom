# Starts the given Peak three times (as a click on the program does) and says how many pets are running. One is right.
# Run on the real machine (the agent's own PowerShell has a private copy of AppData). It closes what it started.
param([string]$Exe = "D:\Claude\projects\streakboom\app\src-tauri\target\release\streakboom.exe")
Get-Process streakboom -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2
foreach ($i in 1..3) { Start-Process $Exe; Start-Sleep -Seconds 4 }
Start-Sleep 4
$n = @(Get-Process streakboom -ErrorAction SilentlyContinue).Count
"started 3 times; streakboom processes running: $n"
if ($n -eq 1) { "OK: one Peak" } else { "WRONG: expected 1" }
