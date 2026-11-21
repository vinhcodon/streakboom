<#
  The measurement of the duo render spike (docs/plans/duo-render-spike.md; exp/duo-prototype only). It starts the spike build in one scenario
  (STREAKBOOM_SPIKE = s0, s1, s2 or s3, see app/src-tauri/src/spike.rs), follows the phases the page writes to spike-phases.log, and every
  2 seconds records, for the whole tree of processes of that start (the program and its WebView2 processes): how many processes, the working
  set and the private memory (MB), and the processor time used since the last sample (as a percent of one core). The spike build has its own
  identifier (com.streakboom.duospike), so it neither touches nor is stopped by the author's Peak and his data folder.

    .\scripts\windows\duo-spike.ps1 -Mode s2 -Exe D:\...\target\release\streakboom.exe -Out D:\...\spike-s2.csv
    .\scripts\windows\duo-spike.ps1 -Attach 5600 -Seconds 60 -Out D:\...\installed.csv   # a running program, read only (a baseline of the installed Peak)

  It writes only numbers (the csv). It stops only the process tree it started, never another Peak.
#>
param(
  [string]$Mode = "",
  [string]$Exe = "",
  [int]$Attach = 0,
  [int]$Seconds = 150,
  [string]$Out = "spike.csv"
)
$ErrorActionPreference = "Stop"
function Tree([int]$rootPid) {
  $all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId
  $ids = New-Object System.Collections.Generic.HashSet[int]; [void]$ids.Add($rootPid)
  $grew = $true
  while ($grew) { $grew = $false; foreach ($p in $all) { if ($ids.Contains([int]$p.ParentProcessId) -and -not $ids.Contains([int]$p.ProcessId)) { [void]$ids.Add([int]$p.ProcessId); $grew = $true } } }
  return $ids
}
$data = Join-Path $env:APPDATA "com.streakboom.duospike"
$phaseLog = Join-Path $data "spike-phases.log"
$proc = $null
if ($Attach -gt 0) { $rootPid = $Attach } else {
  if (-not (Test-Path $Exe)) { throw "No build at $Exe" }
  if (Get-Process -Name "streakboom" -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq (Resolve-Path $Exe).Path }) { throw "A spike build of this path is already running." }
  Remove-Item $phaseLog -ErrorAction SilentlyContinue
  $env:STREAKBOOM_SPIKE = $Mode
  $proc = Start-Process -FilePath $Exe -PassThru
  Remove-Item Env:\STREAKBOOM_SPIKE
  $rootPid = $proc.Id
}
$cores = [Environment]::ProcessorCount
$prev = @{}; $prevT = Get-Date
$rows = New-Object System.Collections.Generic.List[string]
$rows.Add("t_s,phase,processes,ws_mb,private_mb,cpu_pct_of_core")
$t0 = Get-Date
function PhaseNow {
  if (-not (Test-Path $phaseLog)) { return "start" }
  $l = Get-Content $phaseLog -ErrorAction SilentlyContinue | Select-Object -Last 1
  if ($l) { return ($l -split " ")[1] } else { return "start" }
}
try {
  while ($true) {
    Start-Sleep -Seconds 2
    $ids = Tree $rootPid
    $ps = @(); foreach ($i in $ids) { $p = Get-Process -Id $i -ErrorAction SilentlyContinue; if ($p) { $ps += $p } }
    if ($ps.Count -eq 0) { break }
    $now = Get-Date; $dt = ($now - $prevT).TotalSeconds; $prevT = $now
    $cpu = 0.0; $ws = 0.0; $priv = 0.0
    foreach ($p in $ps) {
      $ws += $p.WorkingSet64 / 1MB; $priv += $p.PrivateMemorySize64 / 1MB
      $c = $p.TotalProcessorTime.TotalSeconds
      if ($prev.ContainsKey($p.Id)) { $cpu += ($c - $prev[$p.Id]) }
      $prev[$p.Id] = $c
    }
    $pct = if ($dt -gt 0) { [math]::Round(100.0 * $cpu / $dt, 2) } else { 0 }
    $phase = if ($Attach -gt 0) { "attached" } else { PhaseNow }
    $rows.Add(("{0},{1},{2},{3},{4},{5}" -f [math]::Round(($now - $t0).TotalSeconds, 1), $phase, $ps.Count, [math]::Round($ws, 1), [math]::Round($priv, 1), $pct))
    if ($Attach -gt 0 -and ($now - $t0).TotalSeconds -ge $Seconds) { break }
    if ($Attach -eq 0 -and ($phase -eq "end" -or ($now - $t0).TotalSeconds -ge $Seconds + 60)) { break }
  }
} finally {
  if ($proc -and -not $proc.HasExited) {
    # only the tree this script started
    foreach ($i in (Tree $proc.Id)) { Stop-Process -Id $i -Force -ErrorAction SilentlyContinue }
  }
  [IO.File]::WriteAllLines($Out, $rows)
  Write-Host "wrote $Out ($($rows.Count - 1) samples)"
}
