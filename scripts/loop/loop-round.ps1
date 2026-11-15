<#
  Loop engineering, round driver (E29): for a fixed time it shows test scenes, makes the gestures a person makes at Peak (click, sweeps,
  drag, right clicks, double click) and writes what it saw from OUTSIDE the app, one line per sample, to a CSV: the time, the scene, the
  gesture, and the rectangle of Peak's window (so "did it move, did it answer, did it get stuck" can be counted). Names and numbers only.
  The app's own logs (perch-trace.log, loop-trace.log, chat-trace.log in %APPDATA%\com.streakboom.app) are read afterwards.

    .\scripts\loop\loop-round.ps1 -Minutes 10 -Out C:\somewhere\round1.csv

  It takes the mouse for the whole time. Peak (a dev build) must already be running. Chrome test windows use their own profile.
#>
param([int]$Minutes = 10, [string]$Out = "round.csv")
$ErrorActionPreference = "Stop"
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Collections.Generic; using System.Text;
public static class W {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, int dx, int dy, uint d, UIntPtr e);
  [DllImport("user32.dll")] public static extern int GetSystemMetrics(int i);
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc p, IntPtr l);
  public static List<IntPtr> Of(uint pid) {
    var l = new List<IntPtr>();
    EnumWindows((h, x) => { uint p; GetWindowThreadProcessId(h, out p); if (p == pid && IsWindowVisible(h)) l.Add(h); return true; }, IntPtr.Zero);
    return l;
  }
}
"@
$LD=2;$LU=4;$RD=8;$RU=16
function Peak-Rect {
  $best = $null
  foreach ($p in Get-Process -Name "streakboom*" -ErrorAction SilentlyContinue) {
    foreach ($h in [W]::Of([uint32]$p.Id)) {
      $r = New-Object W+RECT; [void][W]::GetWindowRect($h, [ref]$r)
      $w = $r.R - $r.L; $hh = $r.B - $r.T
      if ($w -gt 40 -and $w -lt 700 -and $hh -gt 40 -and $hh -lt 700) { $best = @($r.L,$r.T,$w,$hh) }
    }
  }
  return $best
}
$t0 = Get-Date
$log = New-Object System.Collections.Generic.List[string]
$log.Add("sec,scene,event,x,y,w,h")
function Sample($scene, $event) {
  $r = Peak-Rect
  $sec = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1)
  if ($r) { $log.Add("$sec,$scene,$event,$($r[0]),$($r[1]),$($r[2]),$($r[3])") } else { $log.Add("$sec,$scene,$event,,,,") }
}
function Pause($ms, $scene) { $n = [int]($ms / 500); for ($i=0; $i -lt $n; $i++) { Start-Sleep -Milliseconds 500; Sample $scene "" } }
function Mv($x,$y) { [void][W]::SetCursorPos([int]$x,[int]$y); Start-Sleep -Milliseconds 40 }
function Click($b) { if ($b -eq "L") { [W]::mouse_event($LD,0,0,0,[UIntPtr]::Zero); [W]::mouse_event($LU,0,0,0,[UIntPtr]::Zero) } else { [W]::mouse_event($RD,0,0,0,[UIntPtr]::Zero); [W]::mouse_event($RU,0,0,0,[UIntPtr]::Zero) } }
$prof = Join-Path $env:TEMP "kioskprofile"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
function Stop-Scene { Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "chrome.exe" -and $_.CommandLine -like "*kioskprofile*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Start-Sleep -Seconds 1 }
function Show-Scene($file, $mode) {
  Stop-Scene
  if (-not $file) { return }
  $url = "file:///" + ((Join-Path $PSScriptRoot $file) -replace "\\", "/")
  if ($mode -eq "kiosk") { $a = @("--user-data-dir=$prof","--kiosk","--no-first-run",$url) } else { $a = @("--user-data-dir=$prof","--no-first-run","--app=$url","--window-size=1000,640","--window-position=420,180") }
  Start-Process $chrome -ArgumentList $a; Start-Sleep -Seconds 3
}
$gestures = @("click","sweep_head","sweep_belly","drag","right_click","right_double","double_click","idle")
function Gesture($g, $scene) {
  $r = Peak-Rect; if (-not $r) { Sample $scene "no_window:$g"; return }
  $cx = $r[0] + $r[2]/2; $cy = $r[1] + $r[3]/2
  Sample $scene "do:$g"
  switch ($g) {
    "click" { Mv $cx $cy; Click "L" }
    "sweep_head" { for ($i=0;$i -lt 6;$i++) { Mv ($cx-25+($i%2)*50) ($cy-$r[3]*0.25); Start-Sleep -Milliseconds 60 } }
    "sweep_belly" { for ($i=0;$i -lt 6;$i++) { Mv ($cx-25+($i%2)*50) ($cy+$r[3]*0.15); Start-Sleep -Milliseconds 60 } }
    "drag" { Mv $cx $cy; [W]::mouse_event($LD,0,0,0,[UIntPtr]::Zero); for ($i=1;$i -le 12;$i++) { Mv ($cx+$i*25) ($cy-$i*8); Start-Sleep -Milliseconds 30 }; [W]::mouse_event($LU,0,0,0,[UIntPtr]::Zero) }
    "right_click" { Mv $cx $cy; Click "R" }
    "right_double" { Mv $cx $cy; Click "R"; Start-Sleep -Milliseconds 90; Click "R" }
    "double_click" { Mv $cx $cy; Click "L"; Start-Sleep -Milliseconds 80; Click "L"; Start-Sleep -Milliseconds 1500; Mv $cx ($cy-200); Click "L" }
    "idle" { }
  }
  Mv 5 5   # the pointer leaves, so the next stretch shows what Peak does on its own
}
$phases = @(
  @{ name="light_kiosk"; file="scene_light.html"; mode="kiosk" },
  @{ name="dark_kiosk"; file="scene_dark.html"; mode="kiosk" },
  @{ name="small_window"; file="scene_light.html"; mode="app" },
  @{ name="desktop_only"; file=$null; mode="" },
  @{ name="light_kiosk2"; file="scene_light.html"; mode="kiosk" }
)
$per = [int](($Minutes * 60) / $phases.Count)
foreach ($ph in $phases) {
  Show-Scene $ph.file $ph.mode
  Sample $ph.name "scene_start"
  $end = (Get-Date).AddSeconds($per - 3); $gi = 0
  while ((Get-Date) -lt $end) {
    Gesture $gestures[$gi % $gestures.Count] $ph.name; $gi++
    Pause 9000 $ph.name
  }
}
Stop-Scene
Sample "end" "end"
[IO.File]::WriteAllLines($Out, $log)
Write-Host "wrote $Out ($($log.Count) lines)"
