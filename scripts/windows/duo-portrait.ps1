# Issue 15 (revision r1) check: Paws as an invited round portrait. Rows for AC1, AC6, AC7 and the captures of AC9; canned replies (STREAKBOOM_DUO_FAKE), the portrait flag on. Keys only while the program under test has the keyboard.
param([switch]$OldShow, [string]$Out = "$env:TEMP\duo-focus", [string]$Exe = "D:\Claude\projects\streakboom-i15\app\src-tauri\target\release\streakboom.exe")
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
  # from whatever it is now: everyone in, then bring out in an order the rules allow (a pet on the screen calls the other; with nobody out the person brings one by name)
  Cmd "cmd:peak:in"; Start-Sleep 3; Cmd "cmd:paws:in"; Start-Sleep 3
  if ($peak) { Cmd "cmd:peak:out"; Start-Sleep 3 }
  if ($paws) { Cmd "cmd:paws:out"; Start-Sleep 3 }
}
function LogLines { if (Test-Path "$data\duo-log.txt") { @(Get-Content "$data\duo-log.txt") } else { @() } }
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
function PawsWin { $l = (Dump) | Where-Object { $_ -like 'paws *' }; ($l -join ' ') }
function Spoke($since) { @((LogLines | Select-Object -Skip $since) | Where-Object { $_ -match '^\d+ shown (peak|paws)' } | ForEach-Object { ($_ -split ' ')[2] }) }
$env:STREAKBOOM_PAWS_PORTRAIT = "1"
$p = Start-Process $Exe -PassThru; Start-Sleep 8
try {
  SetState $true $false; Focus
  # AC1: the invitation shows the portrait beside the chat; a repeated mention reuses it
  $m = (LogLines).Count; Cmd "type:@Paws ban khoe khong"; Start-Sleep -Milliseconds 700; Corner "p1-opening"; Start-Sleep -Milliseconds 900; Corner "p2-greeting"; Start-Sleep 5
  $w1 = PawsWin; Note "AC1 after @Paws: $w1; spoke: $((Spoke $m) -join '+')"
  $m = (LogLines).Count; Cmd "type:@Paws lan nua nhe"; Start-Sleep 6
  Note "AC1 repeat: $(PawsWin) (same as before: $((PawsWin) -eq $w1)); spoke: $((Spoke $m) -join '+')"
  # AC6: the portrait never takes the keyboard
  Note "AC6 focus: the program under test has the keyboard=$(ProgramHasFocus) (front: $(Front))"
  # AC7: dismissal with the chat; the next ordinary message is Peak's alone
  Focus; [System.Windows.Forms.SendKeys]::SendWait("{ESC}"); Start-Sleep -Milliseconds 150; Corner "p3-dismissal"; Start-Sleep 1
  $pp = Presence (Dump); Note "AC7 after Esc: paws window: $(PawsWin); saved paws out=$($pp.pawsOut)"
  $m = (LogLines).Count; Cmd "type:xin chao"; Start-Sleep 6; Note "AC7 next ordinary message, spoke: $((Spoke $m) -join '+') (expected peak only)"
  # AC7: a restart in the middle of a visit returns to Peak alone
  Cmd "type:@Paws chao ban"; Start-Sleep 4; Note "AC7 before restart: $(PawsWin)"
  Stop-Process -Id $p.Id -Force; Start-Sleep 2; $p = Start-Process $Exe -PassThru; Start-Sleep 9
  $pp = Presence (Dump); Note "AC7 after restart: paws window: $(PawsWin); saved paws out=$($pp.pawsOut)"
  # AC6 Quiet: the invitation still brings the portrait, no line is shown
  Cmd "quiet:on"; Start-Sleep 1; $m = (LogLines).Count; Cmd "type:@Paws ban o dau"; Start-Sleep 5
  Note "AC6 Quiet: $(PawsWin); shown lines: $((Spoke $m) -join '+') (expected none)"; Cmd "quiet:off"; Start-Sleep 1
  # AC7: a hidden Peak stays hidden when Paws is invited
  Focus; [System.Windows.Forms.SendKeys]::SendWait("{ESC}"); Start-Sleep 1; Cmd "cmd:peak:in"; Start-Sleep 4; EnsureBox | Out-Null
  Cmd "type:@Paws mot minh thoi"; Start-Sleep 5; $pp = Presence (Dump)
  Note "AC7 hidden Peak: peak on screen=$($pp.peakVis) (expected False); paws: $(PawsWin)"
} finally { $log | ForEach-Object { Write-Output $_ }; Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
