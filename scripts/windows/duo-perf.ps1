# Issue 3: the cost of the complete duo (Peak, Paws, the chat box, a scripted talk, a scene) against Peak alone, and what is given back afterwards.
# exp/duo-prototype only. Same release build, own identifier (com.streakboom.duospike), canned replies (STREAKBOOM_DUO_FAKE), no key, no real provider.
# The whole process tree is counted (the program and its WebView2 processes). No click is made and no key is sent; the commands go through the developer channel.
# Output: a csv of the raw samples and a summary, in $Out (numbers only, no screen content).
param([string]$Out = "$env:TEMP\duo-perf", [string]$Exe = "D:\Claude\projects\streakboom-duo\app\src-tauri\target\release\streakboom.exe", [int]$Seconds = 15, [int]$Runs = 3)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System; using System.Runtime.InteropServices;
public class PM { [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y); }
"@
New-Item -ItemType Directory -Force $Out | Out-Null
$data = "$env:APPDATA\com.streakboom.duospike"
function Cmd($c) { Set-Content -Path "$data\duo-cmd.txt" -Value $c -Encoding ascii; Start-Sleep -Milliseconds 800 }
if (Get-Process streakboom -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $Exe }) { throw "this build is already running: not touching it" }
function TreeSample($rootPid) {
  $all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId
  $ids = New-Object System.Collections.Generic.List[int]; $ids.Add($rootPid); $i = 0
  while ($i -lt $ids.Count) { foreach ($c in ($all | Where-Object { $_.ParentProcessId -eq $ids[$i] })) { if (-not $ids.Contains([int]$c.ProcessId)) { $ids.Add([int]$c.ProcessId) } }; $i++ }
  $ws = 0.0; $pm = 0.0; $cpu = 0.0; $n = 0
  foreach ($id in $ids) { $p = Get-Process -Id $id -ErrorAction SilentlyContinue; if ($p) { $ws += $p.WorkingSet64; $pm += $p.PrivateMemorySize64; try { $cpu += $p.TotalProcessorTime.TotalSeconds } catch {}; $n++ } }
  @{ ws = $ws / 1MB; pm = $pm / 1MB; cpu = $cpu; n = $n; t = [DateTime]::UtcNow }
}
$rows = New-Object System.Collections.Generic.List[object]
function Phase($name, [scriptblock]$during) {
  for ($r = 1; $r -le $Runs; $r++) {
    $s0 = TreeSample $script:rootPid
    if ($during) { & $during } else { Start-Sleep -Seconds $Seconds }
    $s1 = TreeSample $script:rootPid
    $wall = ($s1.t - $s0.t).TotalSeconds
    $row = [pscustomobject]@{ phase = $name; run = $r; procs = $s1.n; private_mb = [math]::Round($s1.pm, 1); workingset_mb = [math]::Round($s1.ws, 1); cpu_pct_of_one_core = [math]::Round(($s1.cpu - $s0.cpu) / $wall * 100, 1); wall_s = [math]::Round($wall, 1) }
    $rows.Add($row); "{0} run {1}: procs={2} private={3} MB ws={4} MB cpu={5}% of one core" -f $name, $r, $row.procs, $row.private_mb, $row.workingset_mb, $row.cpu_pct_of_one_core
  }
}
Remove-Item "$data\duo-log.txt", "$data\duo.json" -ErrorAction SilentlyContinue
$env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_DUO_FAKE = "1"
[void][PM]::SetCursorPos(50, 50)  # the pointer away from where the box shows, so that nothing engages it
$p = Start-Process $Exe -PassThru; $script:rootPid = $p.Id
$latency = New-Object System.Collections.Generic.List[string]
try {
  Start-Sleep 25   # warm-up
  Phase "1_peak_only" $null
  Cmd "call"; Start-Sleep 8
  Phase "2_peak_and_paws_idle" $null
  Cmd "hotbox"; Start-Sleep 3; [void][PM]::SetCursorPos(50, 50)
  Phase "3_plus_chatbox_shown_idle" $null
  # a scripted talk: an unaddressed message (both answer: two calls), a message to Paws alone (one call), repeated inside each run
  Phase "4_scripted_talk" {
    $t0 = [DateTime]::UtcNow
    Cmd "type:@Paws hello"; Start-Sleep -Seconds 4
    Cmd "type:how are you both"; Start-Sleep -Seconds 6
    $left = $Seconds - ([DateTime]::UtcNow - $t0).TotalSeconds; if ($left -gt 0) { Start-Sleep -Seconds $left }
  }
  # latency and number of calls, one message each (canned reply: 400 ms a call, 600 to 1200 ms between the two pets)
  foreach ($msg in @("@Paws latency one", "latency both pets")) {
    Start-Sleep -Seconds 12
    $before = @(Get-Content "$data\duo-log.txt" -ErrorAction SilentlyContinue | Where-Object { $_ -match " line " }).Count
    $sent = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); Cmd "type:$msg"; Start-Sleep -Seconds 9
    $new = @(Get-Content "$data\duo-log.txt" | Where-Object { $_ -match " line " } | Select-Object -Skip $before)
    $stamps = @($new | ForEach-Object { ([long]($_ -split " ")[0]) - $sent })
    $latency.Add("message '$msg': lines shown = $($new.Count) (one model call each); first line after $($stamps[0]) ms, last after $($stamps[-1]) ms (from writing the command; the command itself waits 800 ms in the script)")
  }
  Phase "5_scene_roll" {
    Cmd "scene:roll"; Start-Sleep -Seconds ($Seconds - 1)
    Start-Sleep -Seconds 6   # the scene lasts 14 s: let it end before the next run
  }
  # teardown: hide the box, send Paws in, wait for the bubble window and the second renderer to be given back
  Cmd "hotbox"; Cmd "cmd:paws:in"; Start-Sleep -Seconds 60
  Phase "6_after_teardown_box_hidden_paws_in" $null
} finally {
  $rows | Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\duo-perf-raw.csv"
  $sum = $rows | Group-Object phase | ForEach-Object {
    $g = $_.Group
    [pscustomobject]@{ phase = $_.Name; procs = ($g | Measure-Object procs -Maximum).Maximum
      private_mb_mean = [math]::Round(($g | Measure-Object private_mb -Average).Average, 1); private_mb_min = ($g | Measure-Object private_mb -Minimum).Minimum; private_mb_max = ($g | Measure-Object private_mb -Maximum).Maximum
      ws_mb_mean = [math]::Round(($g | Measure-Object workingset_mb -Average).Average, 1)
      cpu_mean = [math]::Round(($g | Measure-Object cpu_pct_of_one_core -Average).Average, 1); cpu_min = ($g | Measure-Object cpu_pct_of_one_core -Minimum).Minimum; cpu_max = ($g | Measure-Object cpu_pct_of_one_core -Maximum).Maximum }
  }
  $sum | Export-Csv -NoTypeInformation -Encoding UTF8 "$Out\duo-perf-summary.csv"
  $sum | Format-Table -AutoSize | Out-String | Write-Output
  $latency | Set-Content "$Out\duo-perf-latency.txt" -Encoding UTF8; $latency
  Stop-Process -Id $p.Id -Force
}
