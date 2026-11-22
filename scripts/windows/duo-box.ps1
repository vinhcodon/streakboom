# The chat box of the duo prototype (ADR-0142), exp/duo-prototype only: the tray single and double click through the developer channel (the real tray is for the
# person to try), the box at the bottom right, text pasted into the real input (only when the program under test has the keyboard), the box hiding when focus
# goes to a pet, and a single click cancelled by the double click that follows it. Canned replies (STREAKBOOM_DUO_FAKE): no brain, no key.
param([string]$Out = "$env:TEMP\duo-box", [string]$Exe = "D:\Claude\projects\streakboom-duo\app\src-tauri\target\release\streakboom.exe")
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
$log = @()
if (Get-Process streakboom -ErrorAction SilentlyContinue) { throw "a streakboom.exe is already running: not touching it" }
Remove-Item "$data\duo-log.txt" -ErrorAction SilentlyContinue
$env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_DUO_FAKE = "1"; Remove-Item Env:STREAKBOOM_PAWS_PROVIDER -ErrorAction SilentlyContinue
$p = Start-Process $Exe -PassThru; Start-Sleep 7
if ((Get-Content "$data\duo.json" -ErrorAction SilentlyContinue) -notmatch '"paws":\{"out":true') { Cmd "call"; Start-Sleep 3 }
$d = Dump; $log += "B0 start: the box must not be shown"; $log += ($d | Where-Object { $_ -match "^(main|paws|chatbox)" }); Shot "b0-start"
# B1: one tray click shows the box (after the wait for a second click)
Cmd "traysingle"; Start-Sleep -Milliseconds 1500; $d = Dump; $b = Rect4 $d "chatbox"; $log += "B1 single click: the box at the bottom right of the work area (1920x1030, scale 1.25: about x 1479, y 429)"; $log += ($d | Where-Object { $_ -match "^(chatbox|work-area)" }); Shot "b1-box-shown"
# the person's own windows may take the focus while the script runs and the box (not pinned) would hide: pin it for B2 and B3 (the pin is at the top right of the box)
$bp = EnsureBox; Click ($bp.x + $bp.w - 28) ($bp.y + 31); Start-Sleep -Milliseconds 400
# B2: write to both with the real keyboard (a click in the input first: a program that is not in front may not take the keyboard by itself)
$b = Rect4 $d "chatbox"; Click ($b.x + [int]($b.w / 2) - 20) ($b.y + $b.h - 40); Start-Sleep -Milliseconds 500
PasteAndSend "how are you both"
for ($i = 1; $i -le 7; $i++) { Start-Sleep -Milliseconds 1300; Shot ("b2-talk-{0:d2}" -f $i) }
# B3: a message to Peak alone with the Peak chip, and one more
# B4: the focus goes to a pet: the box hides itself (unpinned first)
$bp = Rect4 (Dump) "chatbox"; Click ($bp.x + $bp.w - 28) ($bp.y + 31); Start-Sleep -Milliseconds 400
$d = Dump; $pk = Rect4 $d "paws"; Click ($pk.x + 87) ($pk.y + 106); Start-Sleep -Milliseconds 1200; $d = Dump; $log += "B4 a click on a pet: the box must hide"; $log += ($d | Where-Object { $_ -match "^chatbox" }); Shot "b4-after-blur"
# B5: a single click again shows the box with the talk still in it
Start-Sleep -Milliseconds 1200; Cmd "traysingle"; Start-Sleep -Milliseconds 1500; $d = Dump; $log += "B5 single click again: the box is back"; $log += ($d | Where-Object { $_ -match "^chatbox" }); Shot "b5-box-again"
# B6: a single click and the double click that follows in the same instant: the box must not appear, the pets go in
Cmd "traysingle"; Start-Sleep -Milliseconds 1200; $d = Dump; $log += "B6a single click: the box hides"; $log += ($d | Where-Object { $_ -match "^chatbox" })
Cmd "traysingle`r`ntraydouble"; Start-Sleep -Milliseconds 2500; $d = Dump; $log += "B6b a single click and a double click together: no box, everyone in"; $log += ($d | Where-Object { $_ -match "^(main|paws|chatbox|state)" }); Shot "b6-double"
# B7: a double click again brings the last one out
Cmd "traydouble"; Start-Sleep -Milliseconds 2500; $d = Dump; $log += "B7 double click again: the last one out"; $log += ($d | Where-Object { $_ -match "^(main|paws|chatbox)" }); Shot "b7-out-again"
$log += "duo-log"; $log += (Get-Content "$data\duo-log.txt" -ErrorAction SilentlyContinue | Where-Object { $_ -match " line " })
$log | Set-Content "$Out\duo-box-log.txt" -Encoding UTF8
$log
Stop-Process -Id $p.Id -Force



