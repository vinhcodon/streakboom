# Issue 19 (r1) check: messages sent while an answer is in flight are queued (shown as waiting) and handled in order after it, never dropped. Canned replies.
param([switch]$OldShow, [string]$Out = "$env:TEMP\duo-focus", [string]$Exe = "D:\Claude\projects\streakboom-i17\app\src-tauri\target\release\streakboom.exe")
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing, System.Windows.Forms
Add-Type @"
using System; using System.Runtime.InteropServices;
public class M { [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint d, IntPtr e);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid); }
"@
[void][M]::SetProcessDPIAware()
New-Item -ItemType Directory -Force $Out | Out-Null
$data = "$env:APPDATA\com.streakboom.duospike"
function Cmd($c) { Set-Content -Path "$data\duo-cmd.txt" -Value $c -Encoding ascii; Start-Sleep -Milliseconds 800 }
function Dump { Remove-Item "$data\duo-dump.txt" -ErrorAction SilentlyContinue; Cmd "dump"; Start-Sleep -Milliseconds 400; Get-Content "$data\duo-dump.txt" }
function Rect4($dump, $label) { $l = $dump | Where-Object { $_ -like "$label *" }; if ($l -match 'visible=(\w+) pos=Some\(\((-?\d+), (-?\d+)\)\) size=Some\(\((\d+), (\d+)\)\)') { @{ v = ($matches[1] -eq "true"); x = [int]$matches[2]; y = [int]$matches[3]; w = [int]$matches[4]; h = [int]$matches[5] } } }
function Shot($name) { $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height; $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size); $bmp.Save("$Out\$name.png"); $g.Dispose(); $bmp.Dispose() }
function RawClick($x, $y) { [M]::SetCursorPos($x, $y); Start-Sleep -Milliseconds 120; [M]::mouse_event(2,0,0,0,[IntPtr]::Zero); Start-Sleep -Milliseconds 50; [M]::mouse_event(4,0,0,0,[IntPtr]::Zero) }
# A click is made only inside a window of the program under test, checked against the windows at that moment: never on whatever else is on the screen (the person's own windows).
function Click($x, $y) {
  $d = Dump; $ok = $false
  foreach ($lab in @("main", "paws", "chatbox", "bubble")) { $r = Rect4 $d $lab; if ($r -and $r.v -and $x -ge $r.x -and $x -le $r.x + $r.w -and $y -ge $r.y -and $y -le $r.y + $r.h) { $ok = $true } }
  if ($ok) { RawClick $x $y } else { Write-Output "click at $x,$y skipped: not inside a window of the program under test" }
}
function DblClick($x, $y) {
  # one check against the windows of the program under test, then the two clicks close together (the check takes a second: a double click needs them within half a second)
  $d = Dump; $ok = $false
  foreach ($lab in @("main", "paws", "chatbox", "bubble")) { $r = Rect4 $d $lab; if ($r -and $r.v -and $x -ge $r.x -and $x -le $r.x + $r.w -and $y -ge $r.y -and $y -le $r.y + $r.h) { $ok = $true } }
  if (-not $ok) { Write-Output "double click at $x,$y skipped: not inside a window of the program under test"; return }
  RawClick $x $y; Start-Sleep -Milliseconds 90; RawClick $x $y
}
function ProgramHasFocus { $q = [uint32]0; [void][M]::GetWindowThreadProcessId([M]::GetForegroundWindow(), [ref]$q); $p = Get-Process -Id $q -ErrorAction SilentlyContinue; return ($p -and $p.Path -eq $Exe) }
# the person's own windows may take the focus while the script runs; an unpinned box then hides itself: bring it back with the tray, as the person would
function EnsureBox { $r = Rect4 (Dump) "chatbox"; if (-not ($r -and $r.v)) { Cmd "traysingle"; Start-Sleep -Milliseconds 1500; $r = Rect4 (Dump) "chatbox" }; $r }
function PasteAndSend($text) {
  for ($k = 0; $k -lt 4 -and -not (ProgramHasFocus); $k++) { $bb = EnsureBox; if ($bb -and $bb.v) { Click ($bb.x + [int]($bb.w / 2) - 20) ($bb.y + $bb.h - 40); Start-Sleep -Milliseconds 500 } }
  if (-not (ProgramHasFocus)) { $q = [uint32]0; [void][M]::GetWindowThreadProcessId([M]::GetForegroundWindow(), [ref]$q); $fp = Get-Process -Id $q -ErrorAction SilentlyContinue; Shot "nofocus"; throw "the program under test does not have the keyboard: nothing pasted (in front: $($fp.ProcessName) $($fp.Path))" }
  $old = $null; try { $old = [System.Windows.Forms.Clipboard]::GetText() } catch {}
  $ok = $false; for ($k = 0; $k -lt 8 -and -not $ok; $k++) { try { [System.Windows.Forms.Clipboard]::SetText($text); $ok = $true } catch { Start-Sleep -Milliseconds 250 } }; if (-not $ok) { throw "the clipboard stayed busy: nothing pasted" }; [System.Windows.Forms.SendKeys]::SendWait("^v"); Start-Sleep -Milliseconds 300; [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
  Start-Sleep -Milliseconds 300; try { if ($old) { [System.Windows.Forms.Clipboard]::SetText($old) } else { [System.Windows.Forms.Clipboard]::Clear() } } catch {}
}
function EnsureBox { $r = Rect4 (Dump) "chatbox"; if (-not ($r -and $r.v)) { Cmd "traysingle"; Start-Sleep -Milliseconds 1500; $r = Rect4 (Dump) "chatbox" }; $r }
function Focus { for ($k = 0; $k -lt 4 -and -not (ProgramHasFocus); $k++) { $bb = EnsureBox; if ($bb -and $bb.v) { Click ($bb.x + [int]($bb.w / 2) - 20) ($bb.y + $bb.h - 40); Start-Sleep -Milliseconds 500 } }; if (-not (ProgramHasFocus)) { Shot "nofocus"; throw "the program under test does not have the keyboard: nothing sent" } }
function Keys($seq) { Focus; [System.Windows.Forms.SendKeys]::SendWait($seq); Start-Sleep -Milliseconds 450 }
function PasteText($text) {
  Focus; $old = $null; try { $old = [System.Windows.Forms.Clipboard]::GetText() } catch {}
  $ok = $false; for ($k = 0; $k -lt 8 -and -not $ok; $k++) { try { [System.Windows.Forms.Clipboard]::SetText($text); $ok = $true } catch { Start-Sleep -Milliseconds 250 } }; if (-not $ok) { throw "the clipboard stayed busy: nothing pasted" }
  [System.Windows.Forms.SendKeys]::SendWait("^v"); Start-Sleep -Milliseconds 350
  try { if ($old) { [System.Windows.Forms.Clipboard]::SetText($old) } else { [System.Windows.Forms.Clipboard]::Clear() } } catch {}
}
Add-Type @"
using System; using System.Text; using System.Runtime.InteropServices;
public class W { [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n); }
"@
function Front { $h = [W]::GetForegroundWindow(); $sb = New-Object System.Text.StringBuilder 256; [void][W]::GetWindowText($h, $sb, 256); $q = [uint32]0; [void][M]::GetWindowThreadProcessId($h, [ref]$q); $p = Get-Process -Id $q -ErrorAction SilentlyContinue; "hwnd=$($h.ToInt64()) own=$($p -and $p.Path -eq $Exe) title='$($sb.ToString())'" }
$log = @(); function Note($t) { $script:log += $t }
if (Get-Process streakboom -ErrorAction SilentlyContinue) { throw "a streakboom.exe is already running: not touching it" }
Remove-Item "$data\duo-log.txt", "$data\duo.json" -ErrorAction SilentlyContinue
$env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_DUO_FAKE = "1"
if ($OldShow) { $env:STREAKBOOM_OLD_BUBBLE_SHOW = "1" } else { Remove-Item Env:STREAKBOOM_OLD_BUBBLE_SHOW -ErrorAction SilentlyContinue }
function Presence($d) {
  $st = ($d | Where-Object { $_ -like 'state *' }) -join ' '
  $po = $st -match '"peak":\{"out":(true|false)'; $peakOut = ($matches[1] -eq 'true')
  $wo = $st -match '"paws":\{"out":(true|false)'; $pawsOut = ($matches[1] -eq 'true')
  $mv = (($d | Where-Object { $_ -like 'main *' }) -join ' ') -match 'visible=true'
  $pv = (($d | Where-Object { $_ -like 'paws *' }) -join ' ') -match 'visible=true'
  @{ peakOut = $peakOut; pawsOut = $pawsOut; peakVis = $mv; pawsVis = $pv }
}
function SetState($peak, $paws) {
  # from whatever it is now; Peak walks at its unhurried pace (ADR-0161), so each step waits until the windows say it is done (up to 25 s)
  function WaitPeak($want) { for ($k = 0; $k -lt 50; $k++) { $q = Presence (Dump); if ($q.peakVis -eq $want -and $q.peakOut -eq $want) { Start-Sleep 1; return }; Start-Sleep -Milliseconds 500 } }
  Cmd "cmd:peak:in"; WaitPeak $false; Cmd "cmd:paws:in"; Start-Sleep 2
  if ($peak) { Cmd "cmd:peak:out"; WaitPeak $true }
  if ($paws) { Cmd "cmd:paws:out"; Start-Sleep 3 }
}
function LogLines { if (Test-Path "$data\duo-log.txt") { @(Get-Content "$data\duo-log.txt" -Encoding UTF8) } else { @() } }
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$script:fail = 0
function Row($name, $peak, $paws, $msg, $expect) {
  SetState $peak $paws
  $before = (LogLines).Count
  Cmd "type:$msg"; Start-Sleep 14 # the developer channel sends it as the box does (sendChat), without the list of mentions in the way of Enter
  $p = Presence (Dump)
  $said = @((LogLines | Select-Object -Skip $before) | Where-Object { $_ -match ' line (peak|paws) say ' } | ForEach-Object { if ($_ -match ' line (peak|paws) ') { $matches[1] } })
  $ok = $true; $why = @()
  if ($p.peakOut -ne $p.peakVis) { $ok = $false; $why += "peak state=$($p.peakOut) window=$($p.peakVis)" }
  if ($p.pawsOut -ne $p.pawsVis) { $ok = $false; $why += "paws state=$($p.pawsOut) window=$($p.pawsVis)" }
  if ($expect.peakVis -ne $null -and $p.peakVis -ne $expect.peakVis) { $ok = $false; $why += "peak on screen expected $($expect.peakVis)" }
  if ($expect.pawsVis -ne $null -and $p.pawsVis -ne $expect.pawsVis) { $ok = $false; $why += "paws on screen expected $($expect.pawsVis)" }
  foreach ($w in $expect.said) { if ($said -notcontains $w) { $ok = $false; $why += "$w did not speak" } }
  foreach ($w in $expect.silent) { if ($said -contains $w) { $ok = $false; $why += "$w spoke but should not" } }
  if (-not $ok) { $script:fail++ }
  Note ("{0,-4} {1}  [{2}]  spoke: {3}  {4}" -f $(if ($ok) { "PASS" } else { "FAIL" }), $name, $msg, ($said -join "+"), ($why -join "; "))
}

function Corner($name) { $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object System.Drawing.Bitmap 760, 520; $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Width - 760, $b.Height - 520, 0, 0, (New-Object System.Drawing.Size 760, 520)); $bmp.Save("$Out\$name.png"); $g.Dispose(); $bmp.Dispose() }
function Since($m) { @(LogLines | Select-Object -Skip $m) }
function Calls($l) { @($l | Where-Object { $_ -match ' call (peak|paws) ' } | ForEach-Object { if ($_ -match ' call (peak|paws) ') { $matches[1] } }) -join "+" }
function Said($l) { @($l | Where-Object { $_ -match ' line (peak|paws) say ' } | ForEach-Object { if ($_ -match ' line (peak|paws) say ') { $matches[1] } }) -join "+" }
function Member { (Presence (Dump)).pawsOut }
function PawsWindow { (((Dump) | Where-Object { $_ -like 'paws *' }) -join ' ') }
function Row($name, $msg, $wait = 6) { $m = (LogLines).Count; Cmd "type:$msg"; Start-Sleep $wait; $l = Since $m; Note ("{0,-34} [{1}] calls={2} said={3} member={4}" -f $name, $msg, (Calls $l), (Said $l), (Member)) }
function OpenBox { $r = Rect4 (Dump) "chatbox"; if (-not ($r -and $r.v)) { Cmd "traysingle"; Start-Sleep 2 } }
$env:STREAKBOOM_PAWS_CHAT = "1"
function Corner($name) { $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object System.Drawing.Bitmap 760, 560; $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Width - 760, $b.Height - 560, 0, 0, (New-Object System.Drawing.Size 760, 560)); $bmp.Save("$Out\$name.png"); $g.Dispose(); $bmp.Dispose() }
function Send($t) { Set-Content -Path "$data\duo-cmd.txt" -Value "type:$t" -Encoding ascii }
$env:STREAKBOOM_PAWS_CHAT = "1"
$p = Start-Process $Exe -PassThru; Start-Sleep 8
try {
  SetState $true $false; OpenBox; Focus; Cmd "type:@Paws vao nhom"; Start-Sleep 7
  for ($k = 1; $k -le 3; $k++) {
    $m = (LogLines).Count
    Send "tin A lan $k cho ca hai"; Start-Sleep -Milliseconds 900   # the group answer is in flight
    Send "tin B lan $k"; Start-Sleep -Milliseconds 400; if ($k -eq 1) { Corner "q1-waiting" }
    Send "tin C lan $k"; Start-Sleep 16; if ($k -eq 1) { Corner "q2-done" }
    $l = Since $m
    $persons = @($l | Where-Object { $_ -match 'queued a message|dispatch queued' } | ForEach-Object { ($_ -split ' ', 2)[1] })
    $said = @($l | Where-Object { $_ -match ' line (peak|paws) say ' }).Count
    Note ("round {0}: queued={1} dispatched={2} pet lines={3}" -f $k, @($l | Where-Object { $_ -match 'queued a message' }).Count, @($l | Where-Object { $_ -match 'dispatch queued' }).Count, $said)
  }
} finally { $log | ForEach-Object { Write-Output $_ }; Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
