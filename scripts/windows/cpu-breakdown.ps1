<#
.SYNOPSIS
  Where does Streakboom's CPU go? Samples every few seconds, from outside the app:
  CPU of each process (grouped by role) and whether the pet window moved (= the cat is walking).

.DESCRIPTION
  Reads only process CPU times and window rectangles of Streakboom's own processes. No window titles,
  no content. The app is not touched and needs no debug port.
  Roles: app (the Rust process), browser (the WebView2 manager), gpu, renderer, utility, other.
  Output: a CSV (one row per sample) and a summary printed at the end: mean CPU in percent of ONE core,
  split by role, for samples where a window moved versus samples where nothing moved.

.EXAMPLE
  powershell -File scripts\cpu-breakdown.ps1 -Minutes 12 -IntervalSec 5 -Out "$env:TEMP\streakboom-cpu.csv"
#>
param(
  [double]$Minutes = 10,
  [int]$IntervalSec = 5,
  [string]$Out = (Join-Path $env:TEMP "streakboom-cpu.csv")
)
Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class WinList {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc p, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  // visible top-level windows of the given processes: handle -> "left,top,width,height"
  public static Dictionary<long, string> Rects(HashSet<uint> pids) {
    var d = new Dictionary<long, string>();
    EnumWindows((h, l) => {
      uint pid; GetWindowThreadProcessId(h, out pid);
      if (pids.Contains(pid) && IsWindowVisible(h)) { RECT r; if (GetWindowRect(h, out r)) d[h.ToInt64()] = r.L + "," + r.T + "," + (r.R - r.L) + "," + (r.B - r.T); }
      return true;
    }, IntPtr.Zero);
    return d;
  }
}
"@

function Get-Tree {
  $all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine
  $main = $all | Where-Object { $_.Name -eq "streakboom.exe" } | Select-Object -First 1
  if (-not $main) { return @() }
  $ids = New-Object System.Collections.Generic.HashSet[int]; [void]$ids.Add([int]$main.ProcessId)
  do { $n = $ids.Count; foreach ($p in $all) { if ($ids.Contains([int]$p.ParentProcessId)) { [void]$ids.Add([int]$p.ProcessId) } } } while ($ids.Count -ne $n)
  foreach ($p in $all) {
    if (-not $ids.Contains([int]$p.ProcessId)) { continue }
    $role = if ($p.ProcessId -eq $main.ProcessId) { "app" }
            elseif ($p.CommandLine -match "--type=gpu-process") { "gpu" }
            elseif ($p.CommandLine -match "--type=renderer") { "renderer" }
            elseif ($p.CommandLine -match "--type=utility") { "utility" }
            elseif ($p.CommandLine -notmatch "--type=") { "browser" }
            else { "other" }
    [pscustomobject]@{ Pid = [int]$p.ProcessId; Role = $role }
  }
}

$roles = "app", "browser", "gpu", "renderer", "utility", "other"
"time,moved,total," + ($roles -join ",") | Out-File $Out -Encoding ascii
$prev = @{}; $prevT = $null; $prevRects = $null
$end = (Get-Date).AddMinutes($Minutes)
while ((Get-Date) -lt $end) {
  $tree = @(Get-Tree)
  if (-not $tree.Count) { Start-Sleep $IntervalSec; continue }
  $now = Get-Date
  $cpu = @{}; foreach ($r in $roles) { $cpu[$r] = 0.0 }
  $cur = @{}
  foreach ($t in $tree) {
    try { $c = [System.Diagnostics.Process]::GetProcessById($t.Pid).TotalProcessorTime.TotalSeconds } catch { continue }
    $cur[$t.Pid] = $c
    if ($prevT -and $prev.ContainsKey($t.Pid)) { $cpu[$t.Role] += 100 * ($c - $prev[$t.Pid]) / ($now - $prevT).TotalSeconds }
  }
  $pids = New-Object "System.Collections.Generic.HashSet[uint32]"; foreach ($t in $tree) { [void]$pids.Add([uint32]$t.Pid) }
  $rects = [WinList]::Rects($pids)
  $moved = 0
  if ($prevRects) { foreach ($k in $rects.Keys) { if ($prevRects.ContainsKey($k) -and $prevRects[$k] -ne $rects[$k]) { $moved = 1 } } }
  if ($prevT) {
    $total = [math]::Round(($roles | ForEach-Object { $cpu[$_] } | Measure-Object -Sum).Sum, 2)
    ($now.ToString("s") + ",$moved,$total," + (($roles | ForEach-Object { [math]::Round($cpu[$_], 2) }) -join ",")) | Out-File $Out -Append -Encoding ascii
  }
  $prev = $cur; $prevT = $now; $prevRects = $rects
  Start-Sleep -Seconds $IntervalSec
}

$rows = Import-Csv $Out
"samples: $($rows.Count) (every $IntervalSec s). CPU in percent of ONE core, mean per sample."
foreach ($m in 0, 1) {
  $g = @($rows | Where-Object { [int]$_.moved -eq $m })
  if (-not $g.Count) { "moved=$m : no samples"; continue }
  $line = "moved=$m (" + $(if ($m) { "walking or dragged" } else { "no window moved" }) + ") n=$($g.Count) total=" + [math]::Round(($g | ForEach-Object { [double]$_.total } | Measure-Object -Average).Average, 1)
  foreach ($r in $roles) { $line += "  $r=" + [math]::Round(($g | ForEach-Object { [double]$_.$r } | Measure-Object -Average).Average, 1) }
  $line
}
$all = @($rows | ForEach-Object { [double]$_.total } | Sort-Object)
if ($all.Count) { "total CPU percentiles: min=$($all[0]) median=$($all[[int]($all.Count/2)]) p90=$($all[[int]($all.Count*0.9)]) max=$($all[-1])" }
