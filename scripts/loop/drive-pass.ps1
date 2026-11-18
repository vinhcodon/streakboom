<#
  A scripted measuring round of the pointer passes over Peak (E33, ADR-0133): a test aid for a Preview or developer build, never for a person's machine.
  It moves the real cursor with human-like strokes (a smooth speed curve, a curved path, a little tremor, pauses inside a stroke, the sampling rate of
  a mouse or of a trackpad) and writes one `mark` line per pass into `pass-marks.log` (beside loop-trace.log) so the pass lines can be joined to what
  was meant. A script is not a hand: it shows what the detector does with a given speed and path, not what a person does.

  Rounds:  1 calm mouse (125 Hz, steady)   2 trackpad (60 Hz, curved, with pauses, slower)   3 hurried mouse (fast, overshoot, jittery rate)
  Run it with -Round 1,2,3 (the default). Peak and the build must be running; the cursor is moved by the script for about 3 minutes per round.
#>
param([int[]]$Round = @(1, 2, 3))
Add-Type -TypeDefinition @'
using System; using System.Diagnostics; using System.Runtime.InteropServices; using System.Text; using System.Threading;
public static class P {
  public delegate bool EP(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EP p, IntPtr l);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out R r);
  [DllImport("user32.dll")] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool SetCursorPos(int x, int y);
  [DllImport("winmm.dll")] public static extern uint timeBeginPeriod(uint ms);
  [StructLayout(LayoutKind.Sequential)] public struct R { public int L, T, R2, B; }
  public static Random Rnd = new Random(11);
  public static int[] Rect(uint pid) {
    int[] res = null;
    EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p);
      if (p == pid && IsWindowVisible(h)) { var s = new StringBuilder(50); GetWindowText(h, s, 50);
        if (s.ToString() == "Streakboom") { R r; GetWindowRect(h, out r); res = new[] { r.L, r.T, r.R2, r.B }; } } return true; }, IntPtr.Zero);
    return res;
  }
  public static void Go(int x, int y) { SetCursorPos(x, y); }
  static double MinJerk(double t) { return t * t * t * (10 - 15 * t + 6 * t * t); }
  // One stroke from (x0,y0) to (x1,y1) in durMs, sampled every dtMs (+- jitter), the path bowed by `curve` px, a tremor of `tremor` px.
  public static void Stroke(double x0, double y0, double x1, double y1, int durMs, int dtMs, int jitterMs, double curve, double tremor) {
    if (durMs < 1) durMs = 1;
    double dx = x1 - x0, dy = y1 - y0, len = Math.Sqrt(dx * dx + dy * dy); if (len < 1) len = 1;
    double nx = -dy / len, ny = dx / len; var sw = Stopwatch.StartNew(); double next = 0;
    while (true) {
      double t = sw.Elapsed.TotalMilliseconds; if (t >= durMs) t = durMs;
      double u = MinJerk(t / durMs), bow = curve * Math.Sin(Math.PI * u);
      double x = x0 + dx * u + nx * bow + (Rnd.NextDouble() - 0.5) * 2 * tremor, y = y0 + dy * u + ny * bow + (Rnd.NextDouble() - 0.5) * 2 * tremor;
      SetCursorPos((int)Math.Round(x), (int)Math.Round(y));
      if (t >= durMs) break;
      next += dtMs + (jitterMs > 0 ? Rnd.Next(-jitterMs, jitterMs + 1) : 0); if (next <= t) next = t + 1;
      while (sw.Elapsed.TotalMilliseconds < next) { if (next - sw.Elapsed.TotalMilliseconds > 2) Thread.Sleep(1); }
    }
  }
  public static void Wait(int ms) { Thread.Sleep(ms); }
  public static double Rand(double a, double b) { return a + Rnd.NextDouble() * (b - a); }
  public static int RandI(int a, int b) { return Rnd.Next(a, b + 1); }
}
'@
[void][P]::timeBeginPeriod(1)   # without it a step of 8 ms is really 15 ms and a quick flick has two or three positions, not a mouse's hundred a second
$marks = Join-Path $env:APPDATA "com.streakboom.app\pass-marks.log"
function Mark($rd, $kind, $variant, $info) {
  $ms = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  Add-Content -Path $marks -Value "$ms mark round=$rd kind=$kind variant=$variant $info rect=$($script:rectS) device=script" -Encoding utf8
}
$ppid = (Get-Process streakboom -ErrorAction Stop | Select-Object -First 1).Id
function Park($rect) { [P]::Go($rect[0] - 320, $rect[1] - 120); [P]::Wait([P]::RandI(900, 1300)) }

# the three scenarios: sampling period, jitter of the period, tremor, a multiplier on every duration (more = slower), the bow of a path, pauses inside a stroke
$SC = @{
  1 = @{ name = 'calm mouse';    dt = 8;  jit = 1; tre = 0.3; slow = 1.0; curve = 4;  pause = $false; over = $false }
  2 = @{ name = 'trackpad';      dt = 16; jit = 3; tre = 1.0; slow = 1.5; curve = 14; pause = $true;  over = $false }
  3 = @{ name = 'hurried mouse'; dt = 8;  jit = 4; tre = 0.8; slow = 0.6; curve = 8;  pause = $false; over = $true }
}
foreach ($rd in $Round) {
  $sc = $SC[$rd]; $dt = $sc.dt; $jit = $sc.jit; $tre = $sc.tre; $k = $sc.slow; $cv = $sc.curve
  function St($x0, $y0, $x1, $y1, $ms, $curveMul = 1.0) { [P]::Stroke($x0, $y0, $x1, $y1, [int]($ms * $k), $dt, $jit, ($cv * $curveMul * ([P]::Rand(-1, 1))), $tre) }
  $plan = @()
  foreach ($v in 'rub_head', 'rub_belly', 'rub_circle', 'rub_zigzag') { 1..2 | ForEach-Object { $plan += , @('slow', $v) } }
  foreach ($v in 'cross_h', 'cross_diag', 'cross_v') { 1..3 | ForEach-Object { $plan += , @('ordinary', $v) } }
  foreach ($v in 'approach_stop', 'approach_back') { 1..3 | ForEach-Object { $plan += , @('toward', $v) } }
  foreach ($v in 'flick_in', 'flick_out', 'flick_diag', 'flick_short') { 1..4 | ForEach-Object { $plan += , @('flick', $v) } }
  1..4 | ForEach-Object { $plan += , @('run', 'taskbar_run') }
  $order = 0..($plan.Count - 1) | Sort-Object { [P]::Rnd.Next() }
  foreach ($ix in $order) {
    $kind = $plan[$ix][0]; $var = $plan[$ix][1]
    $rect = [P]::Rect($ppid); if (-not $rect) { Start-Sleep 2; $rect = [P]::Rect($ppid); if (-not $rect) { continue } }
    $script:rectS = ($rect -join ','); $L = $rect[0]; $T = $rect[1]; $RT = $rect[2]; $BT = $rect[3]; $cx = [int](($L + $RT) / 2); $cy = [int](($T + $BT) / 2)
    $head = $T + 30; $belly = $T + 95
    switch ($var) {
      'rub_head'   { $y = $head + [P]::RandI(-8, 8); $n = [P]::RandI(3, 5); $x = $cx - 40; Mark $rd $kind $var "strokes=$n"
                     for ($i = 0; $i -lt $n; $i++) { $to = if ($i % 2 -eq 0) { $cx + [P]::RandI(30, 50) } else { $cx - [P]::RandI(30, 50) }; St $x $y $to ($y + [P]::RandI(-4, 4)) ([P]::RandI(260, 420)); $x = $to; if ($sc.pause -and $i -eq 1) { [P]::Wait(120) } } }
      'rub_belly'  { $y = $belly + [P]::RandI(-8, 8); $n = [P]::RandI(3, 5); $x = $cx - 35; Mark $rd $kind $var "strokes=$n"
                     for ($i = 0; $i -lt $n; $i++) { $to = if ($i % 2 -eq 0) { $cx + [P]::RandI(25, 45) } else { $cx - [P]::RandI(25, 45) }; St $x $y $to ($y + [P]::RandI(-6, 6)) ([P]::RandI(300, 500)); $x = $to } }
      'rub_circle' { $rad = [P]::RandI(14, 26); Mark $rd $kind $var "r=$rad"; $px = $cx + $rad; $py = $belly
                     for ($a = 30; $a -le 720; $a += 30) { $qx = $cx + $rad * [math]::Cos($a * [math]::PI / 180); $qy = $belly + $rad * [math]::Sin($a * [math]::PI / 180); St $px $py $qx $qy 45 0.2; $px = $qx; $py = $qy } }
      'rub_zigzag' { Mark $rd $kind $var ""; $x = $cx - 30; $y = $head; for ($i = 0; $i -lt 8; $i++) { $tx = $cx + (($i % 2) * 2 - 1) * 28; $ty = $y + 9; St $x $y $tx $ty ([P]::RandI(130, 220)) 0.3; $x = $tx; $y = $ty } }
      'cross_h'    { $sp = [P]::RandI(350, 1400); $len = ($RT - $L) + 360; $ms = [int]($len * 1000 / $sp); $y = $cy + [P]::RandI(-30, 40); Mark $rd $kind $var "speed=$sp"
                     if ([P]::RandI(0, 1)) { St ($L - 180) $y ($RT + 180) ($y + [P]::RandI(-12, 12)) $ms } else { St ($RT + 180) $y ($L - 180) ($y + [P]::RandI(-12, 12)) $ms } }
      'cross_diag' { $sp = [P]::RandI(350, 1400); $ms = [int](420 * 1000 / $sp); Mark $rd $kind $var "speed=$sp"
                     if ([P]::RandI(0, 1)) { St ($L - 150) ($T - 100) ($RT + 150) ($BT + 60) $ms } else { St ($RT + 150) ($BT + 80) ($L - 150) ($T - 60) $ms } }
      'cross_v'    { $sp = [P]::RandI(350, 1200); $ms = [int](430 * 1000 / $sp); $x = $cx + [P]::RandI(-40, 40); Mark $rd $kind $var "speed=$sp"
                     if ([P]::RandI(0, 1)) { St $x ($T - 150) ($x + [P]::RandI(-10, 10)) ($BT + 150) $ms } else { St $x ($BT + 150) $x ($T - 150) $ms } }
      'approach_stop' { $ms = [P]::RandI(500, 900); Mark $rd $kind $var ""; $y = $cy + [P]::RandI(-20, 20); St ($L - 200) $y ($L + [P]::RandI(20, 60)) ($y + 5) $ms; [P]::Wait([P]::RandI(500, 1200)) }
      'approach_back' { $ms = [P]::RandI(450, 800); Mark $rd $kind $var ""; $y = $cy + [P]::RandI(-20, 20); St ($RT + 200) $y ($RT - [P]::RandI(30, 70)) $y $ms; [P]::Wait([P]::RandI(60, 200)); St ($RT - 50) $y ($RT + 220) ($y + 20) ([P]::RandI(500, 900)) }
      'flick_in'   { $sp = [P]::RandI(1200, 4200); $len = [P]::RandI(90, 170); $ms = [int]($len * 1000 / $sp); $dir = if ([P]::RandI(0, 1)) { 1 } else { -1 }; $y = $cy + [P]::RandI(-30, 40)
                     Mark $rd $kind $var "speed=$sp len=$len"; St ($cx - $dir * $len / 2) $y ($cx + $dir * $len / 2) ($y + [P]::RandI(-8, 8)) $ms 0.3 }
      'flick_out'  { $sp = [P]::RandI(1200, 4200); $len = [P]::RandI(120, 260); $ms = [int]($len * 1000 / $sp); $dir = if ([P]::RandI(0, 1)) { 1 } else { -1 }; $y = $cy + [P]::RandI(-30, 40)
                     Mark $rd $kind $var "speed=$sp len=$len"; St ($cx - $dir * ($len - 20)) $y ($cx + $dir * 20) $y $ms 0.3; if ($sc.over) { St ($cx + $dir * 20) $y ($cx + $dir * 70) $y 60 0.1 } }
      'flick_diag' { $sp = [P]::RandI(1200, 4200); $len = [P]::RandI(100, 200); $ms = [int]($len * 1000 / $sp); $ang = [P]::Rand(-1.0, 1.0); $dir = if ([P]::RandI(0, 1)) { 1 } else { -1 }
                     Mark $rd $kind $var "speed=$sp len=$len"; St ($cx - $dir * $len / 2) ($cy - $ang * $len / 2) ($cx + $dir * $len / 2) ($cy + $ang * $len / 2) $ms 0.3 }
      'flick_short' { $sp = [P]::RandI(900, 3000); $len = [P]::RandI(35, 70); $ms = [int]($len * 1000 / $sp); $dir = if ([P]::RandI(0, 1)) { 1 } else { -1 }; $y = $cy + [P]::RandI(-25, 35)
                     Mark $rd $kind $var "speed=$sp len=$len"; St ($cx - $dir * $len / 2) $y ($cx + $dir * $len / 2) $y $ms 0.2 }
      'taskbar_run' { $sp = [P]::RandI(2500, 4500); $ms = [int](900 * 1000 / $sp); $y = $cy + [P]::RandI(-10, 60); Mark $rd $kind $var "speed=$sp"
                     if ([P]::RandI(0, 1)) { St ($L - 450) $y ($RT + 450) ($y + [P]::RandI(-15, 15)) $ms 0.2 } else { St ($RT + 450) $y ($L - 450) ($y + [P]::RandI(-15, 15)) $ms 0.2 } }
    }
    Park $rect
  }
  Mark $rd 'round_end' 'none' "name=$($sc.name)"
}
Mark 0 'stop' 'none' ''
Write-Host 'driven done'
