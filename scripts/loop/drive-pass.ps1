Add-Type @'
using System; using System.Runtime.InteropServices; using System.Text;
public class D { public delegate bool EP(IntPtr h, IntPtr l);
 [DllImport("user32.dll")] public static extern bool EnumWindows(EP p, IntPtr l);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R r);
 [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
 [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
 public struct R { public int L,T,Rr,B; } }
'@
$log = Join-Path $env:APPDATA "com.streakboom.app\loop-trace.log"
function Mark($kind) { $ms=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); Add-Content -Path $log -Value "$ms mark kind=$kind device=script" -Encoding utf8 }
function Peak {
  $pid4=(Get-Process streakboom -ErrorAction Stop | Select-Object -First 1).Id; $script:rect=$null
  [D]::EnumWindows({ param($h,$l) $p=0; [void][D]::GetWindowThreadProcessId($h,[ref]$p)
    if($p -eq $pid4 -and [D]::IsWindowVisible($h)){ $s=New-Object Text.StringBuilder 50; [void][D]::GetWindowText($h,$s,50)
      if($s.ToString() -eq 'Streakboom'){ $r=New-Object D+R; [void][D]::GetWindowRect($h,[ref]$r); $script:rect=$r } }; $true },[IntPtr]::Zero) | Out-Null
  $script:rect
}
function Sweep($x0,$y0,$x1,$y1,$stepPx,$stepMs) {
  $d=[math]::Sqrt(($x1-$x0)*($x1-$x0)+($y1-$y0)*($y1-$y0)); $n=[math]::Max(1,[int]($d/$stepPx))
  for($i=0;$i -le $n;$i++){ [void][D]::SetCursorPos([int]($x0+($x1-$x0)*$i/$n),[int]($y0+($y1-$y0)*$i/$n)); Start-Sleep -Milliseconds $stepMs }
}
$rnd = New-Object Random 7
function Jit($v){ $v + $rnd.Next(-6,7) }
foreach($kind in 'slow','ordinary','toward','flick'){
  Mark $kind
  foreach($i in 1..10) {
    $r=Peak; if(-not $r){ break }
    $cx=[int](($r.L+$r.Rr)/2); $cy=[int](($r.T+$r.B)/2); $top=$r.T+25; $belly=$r.T+95
    switch($kind){
      'slow'     { $y= if($i % 2){$top}else{$belly}; Sweep ($cx-45) (Jit $y) ($cx+45) (Jit $y) 4 18; Sweep ($cx+45) $y ($cx-45) $y 4 18; Sweep ($cx-45) $y ($cx+40) $y 4 18 }
      'ordinary' { $y=Jit($cy+10); if($i % 2){ Sweep ($r.L-150) $y ($r.Rr+150) $y 9 16 } else { Sweep ($r.Rr+150) $y ($r.L-150) $y 9 16 } }
      'toward'   { $y=Jit($cy); Sweep ($r.L-160) $y $cx $y 7 16; Start-Sleep -Milliseconds 80; Sweep $cx $y ($r.L-160) $y 5 20 }
      'flick'    { $y=Jit($cy); if($i % 2){ Sweep ($cx-60) $y ($cx+70) $y 24 9 } else { Sweep ($cx+60) $y ($cx-70) $y 24 9 } }
    }
    [void][D]::SetCursorPos($r.L-300, $r.T-100); Start-Sleep -Milliseconds 1100
  }
}
Mark 'stop'
Write-Host "driven done"
