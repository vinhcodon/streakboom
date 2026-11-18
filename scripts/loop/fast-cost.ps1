<#
  The cost of the fine sampler of the pointer near Peak (ADR-0135, E33 IR-4a), read from the **CPU cycles of every thread** (QueryThreadCycleTime):
  the tick-based CPU time of Windows (Get-Process ... TotalProcessorTime) misreads threads that wake every few milliseconds and showed 3 times too much.
  Three windows of 12 s: the pointer far from Peak, the pointer resting inside the zone (the window and 80 px around it), far again. The share of one
  core uses the nominal clock of the CPU, so it is a lower bound. A test aid: the program must be a test build (terrain-overlay feature or a Preview).
  A debug build costs more than a release one; read the figures as an upper bound of a release build.
#>
Add-Type @'
using System; using System.Runtime.InteropServices; using System.Text;
public static class C4 {
  public delegate bool EP(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EP p, IntPtr l);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out R r);
  [DllImport("user32.dll")] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("kernel32.dll")] public static extern IntPtr OpenThread(uint a, bool inh, uint id);
  [DllImport("kernel32.dll")] public static extern bool QueryThreadCycleTime(IntPtr h, out ulong c);
  [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr h);
  [StructLayout(LayoutKind.Sequential)] public struct R { public int L, T, R2, B; }
  public static int[] Rect(uint pid) { int[] res = null;
    EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); if (p == pid && IsWindowVisible(h)) { var s = new StringBuilder(50); GetWindowText(h, s, 50); if (s.ToString() == "Streakboom") { R r; GetWindowRect(h, out r); res = new[] { r.L, r.T, r.R2, r.B }; } } return true; }, IntPtr.Zero); return res; }
  public static ulong Cyc(uint tid) { IntPtr h = OpenThread(0x800, false, tid); if (h == IntPtr.Zero) return 0; ulong c; QueryThreadCycleTime(h, out c); CloseHandle(h); return c; }
}
'@
$ghz = (Get-CimInstance Win32_Processor | Select-Object -First 1).MaxClockSpeed / 1000.0
$p = Get-Process streakboom -ErrorAction Stop | Select-Object -First 1
$r = [C4]::Rect($p.Id); if (-not $r) { throw "no Peak window" }
function Snap { $h = @{}; foreach ($t in (Get-Process -Id $p.Id).Threads) { $h[[uint32]$t.Id] = [C4]::Cyc([uint32]$t.Id) }; $h }
function Window($label, $pos, $secs) {
  [void][C4]::SetCursorPos($pos[0], $pos[1]); Start-Sleep 3; $a = Snap; Start-Sleep $secs; $b = Snap
  $tot = 0.0; $rows = foreach ($k in $b.Keys) { if ($a.ContainsKey($k)) { $d = [double]($b[$k] - $a[$k]); $tot += $d; if ($d -gt 5e6) { [pscustomobject]@{ Tid = $k; Mcycles = [math]::Round($d / 1e6); CorePct = [math]::Round(100 * $d / ($secs * $ghz * 1e9), 2) } } } }
  Write-Host ("== {0} ({1} s): all threads {2:N2} % of one core" -f $label, $secs, (100 * $tot / ($secs * $ghz * 1e9)))
  $rows | Sort-Object Mcycles -Descending | Select-Object -First 4 | Format-Table -AutoSize | Out-String | Write-Host
}
Write-Host "nominal clock $ghz GHz; settling for 45 s first"
[void][C4]::SetCursorPos(($r[0] - 700), ($r[1] - 300)); Start-Sleep 45
$far = @(($r[0] - 700), ($r[1] - 300)); $mid = @([int](($r[0] + $r[2]) / 2), [int](($r[1] + $r[3]) / 2))
Window 'pointer far' $far 12
Window 'pointer resting in the zone' $mid 12
Window 'pointer far again' $far 12
[void][C4]::SetCursorPos($far[0], $far[1])
