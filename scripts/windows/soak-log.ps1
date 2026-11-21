<#
.SYNOPSIS
  Soak test helper (hypothesis A5): every N seconds, log the memory and CPU of Streakboom and its
  WebView2 child processes to a CSV, so growth over hours can be read afterwards.

.EXAMPLE
  .\scripts\soak-log.ps1 -Hours 8 -IntervalSec 300 -Out "$env:TEMP\streakboom-soak.csv"

  Reads only process numbers (no window titles, no content). Stops by itself after -Hours.
#>
param(
  [double]$Hours = 8,
  [int]$IntervalSec = 300,
  [string]$Out = (Join-Path $env:TEMP "streakboom-soak.csv")
)
$end = (Get-Date).AddHours($Hours)
if (-not (Test-Path $Out)) { "time,procs,private_mb,workingset_mb,cpu_sec_total,cpu_pct_interval,main_pid" | Out-File $Out -Encoding ascii }
$lastCpu = $null; $lastT = $null
while ((Get-Date) -lt $end) {
  $main = Get-Process streakboom -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $main) {
    "$((Get-Date).ToString('s')),0,0,0,0,0,none" | Out-File $Out -Append -Encoding ascii
  } else {
    # the main process plus every descendant (the WebView2 helpers)
    $all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId
    $ids = New-Object System.Collections.Generic.HashSet[int]; [void]$ids.Add($main.Id)
    do { $n = $ids.Count; foreach ($p in $all) { if ($ids.Contains([int]$p.ParentProcessId)) { [void]$ids.Add([int]$p.ProcessId) } } } while ($ids.Count -ne $n)
    $ps = $ids | ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue }
    $priv = [math]::Round((($ps | Measure-Object PrivateMemorySize64 -Sum).Sum) / 1MB, 1)
    $ws = [math]::Round((($ps | Measure-Object WorkingSet64 -Sum).Sum) / 1MB, 1)
    $cpu = [math]::Round((($ps | Measure-Object CPU -Sum).Sum), 1)
    $now = Get-Date
    $pct = if ($lastCpu -ne $null -and $cpu -ge $lastCpu) { [math]::Round(100 * ($cpu - $lastCpu) / (($now - $lastT).TotalSeconds * [Environment]::ProcessorCount), 2) } else { 0 }
    $lastCpu = $cpu; $lastT = $now
    "$($now.ToString('s')),$($ps.Count),$priv,$ws,$cpu,$pct,$($main.Id)" | Out-File $Out -Append -Encoding ascii
  }
  Start-Sleep -Seconds $IntervalSec
}
