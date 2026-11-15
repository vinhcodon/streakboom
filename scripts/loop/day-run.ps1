<#
  A working day with Peak's newest rules (E29): start the dev build with the screen picture on, work as you always do, and later send me
  the folder this script fills. It keeps only what the app writes about itself: names and numbers (the time, the cover share of the
  cat's box, which moves it made, which gate stopped it). No window titles, no screen content, no key presses, no words.

    .\scripts\loop\day-run.ps1                    # until you press Ctrl+C (or close the window); about 8 hours is a good day
    .\scripts\loop\day-run.ps1 -Hours 6 -Out D:\peak-day

  What it does: (1) quits nothing of yours: if the installed Peak is running it stops and tells you to quit it from the tray first,
  (2) starts the dev build in the background with the terrain feature and STREAKBOOM_DEV_PICTURE=1 (the picture on, no overlay),
  (3) every 2 minutes copies the new lines of loop-trace.log and perch-trace.log into the folder, (4) at the end quits the dev build and
  writes summary.txt (python scripts\loop\score_day.py). Your Peak data folder (%APPDATA%\com.streakboom.app) is the same one the
  installed Peak uses; the dev build reads and writes it like the installed one.
  Needs the repository's tools: node, npm and cargo (the same as `npm run tauri dev`). The first start compiles for about a minute.
#>
param([double]$Hours = 8, [string]$Out = "")
$ErrorActionPreference = "Stop"
$repo = Resolve-Path (Join-Path $PSScriptRoot "..\..")
if (-not $Out) { $Out = Join-Path $repo ("peak-day-" + (Get-Date -Format "yyyyMMdd-HHmm")) }
New-Item -ItemType Directory -Force $Out | Out-Null
if (Get-Process -Name "streakboom*" -ErrorAction SilentlyContinue) { throw "Peak is running. Quit it from the tray menu first, then run this again." }
$data = Join-Path $env:APPDATA "com.streakboom.app"
$env:STREAKBOOM_DEV_PICTURE = "1"
Remove-Item Env:\STREAKBOOM_NO_SETTLE -ErrorAction SilentlyContinue
Write-Host "Starting the dev build (the first start compiles for about a minute)..."
$p = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$repo\app`" && npm run tauri dev -- --features terrain-overlay" -WindowStyle Hidden -PassThru
$files = @("loop-trace.log", "perch-trace.log")
$seen = @{}; foreach ($f in $files) { $seen[$f] = 0 }
function Copy-New {
  foreach ($f in $files) {
    $src = Join-Path $data $f
    if (-not (Test-Path $src)) { continue }
    $lines = Get-Content -Path $src -Encoding UTF8
    $new = @($lines | Where-Object { $parts = $_ -split " ", 2; ($parts[0] -as [int64]) -gt $seen[$f] })
    if ($new.Count -gt 0) {
      Add-Content -Path (Join-Path $Out $f) -Value $new -Encoding UTF8
      $seen[$f] = [int64](($new[-1] -split " ", 2)[0])
    }
  }
}
function Stop-Peak {
  Get-Process -Name "streakboom*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*$($repo.Path)*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
$end = (Get-Date).AddHours($Hours)
Write-Host "Peak is starting. Work as usual. It stops at $($end.ToString('HH:mm')) or when you press Ctrl+C. Output folder: $Out"
try {
  while ((Get-Date) -lt $end) { Start-Sleep -Seconds 120; Copy-New }
} finally {
  Copy-New
  Stop-Peak
  $py = Get-Command python -ErrorAction SilentlyContinue
  if ($py) { & python (Join-Path $PSScriptRoot "score_day.py") (Join-Path $Out "loop-trace.log") | Out-File -Encoding utf8 (Join-Path $Out "summary.txt") }
  Write-Host "Done. Send the folder $Out (loop-trace.log, perch-trace.log, summary.txt)."
}
