# Who hears without buttons, and the double click (ADR-0145), exp/duo-prototype only: a double click on a pet opens the box with the keyboard and @Name in the field,
# a message with no name goes to every pet that is out, a name picks one, with both in the field says so and refuses what is not a command. Canned replies; no brain, no key.
# Clicks only inside the windows of the program under test; keys only while it has the keyboard.
param([string]$Out = "$env:TEMP\duo-dblclick", [string]$Exe = "D:\Claude\projects\streakboom-duo\app\src-tauri\target\release\streakboom.exe")
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
$log = @(); function Note($t) { $script:log += $t }
function Dbl($label) { $r = Rect4 (Dump) $label; $cx = $r.x + 87; $cy = $r.y + 106; DblClick $cx $cy; Start-Sleep -Milliseconds 1800 }
function Crop($name) { $b = Rect4 (Dump) "chatbox"; if (-not ($b -and $b.v)) { Note "$name : the box is not showing"; return }; $s = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object System.Drawing.Bitmap $s.Width, $s.Height; $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($s.Location, [System.Drawing.Point]::Empty, $s.Size); $g.Dispose(); $c = $bmp.Clone((New-Object System.Drawing.Rectangle $b.x, $b.y, $b.w, $b.h), $bmp.PixelFormat); $c.Save("$Out\$name.png"); $c.Dispose(); $bmp.Dispose() }
function Lines { Get-Content "$data\duo-log.txt" -ErrorAction SilentlyContinue | Where-Object { $_ -match " line " } | ForEach-Object { $_ -replace '^\d+ ','' } }
if (Get-Process streakboom -ErrorAction SilentlyContinue) { throw "a streakboom.exe is already running: not touching it" }
Remove-Item "$data\duo-log.txt", "$data\duo.json" -ErrorAction SilentlyContinue   # a state of its own: Peak out, Paws in
$env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_DUO_FAKE = "1"
$p = Start-Process $Exe -PassThru; Start-Sleep 7
try {
  Cmd "call"; Start-Sleep 3
  if (-not (Dump | Where-Object { $_ -match "^paws visible=true" })) { throw "Paws did not come out: the check cannot start" }
  Cmd "pinbox"
  # D1 a double click on Paws: the box with the keyboard and @Paws in the field
  Dbl "paws"; Note "D1 after a double click on Paws: the box shows, has the keyboard"; Note (Dump | Where-Object { $_ -match "^chatbox" }); Note "keyboard in the program: $(ProgramHasFocus)"; Crop "d1-paws"
  PasteText "how are you"; Keys "{ENTER}"; Start-Sleep -Seconds 5; Crop "d1b-sent"; Note "D1 lines (only Paws must have answered):"; Note (Lines)
  # D2 a double click on Peak: @Peak in the field (only the prefill is checked: a message to Peak alone would go to the real brain)
  Remove-Item "$data\duo-log.txt" -ErrorAction SilentlyContinue
  Dbl "main"; Crop "d2-peak"; Note "D2 after a double click on Peak: the box and @Peak (see d2-peak.png)"; Keys "{ESC}"
  # D3 a message with no name: both hear
  PasteText "how are you both feeling"; Keys "{ENTER}"; Start-Sleep -Seconds 7; Crop "d3-both"; Note "D3 lines (Peak then Paws):"; Note (Lines)
  # D4 everyone in: the field says so; a message that is not a command stays; a command goes
  Cmd "traydouble"; Start-Sleep -Milliseconds 3000; Note "D4 both in:"; Note (Dump | Where-Object { $_ -match "^(main|paws|chatbox)" })
  Remove-Item "$data\duo-log.txt" -ErrorAction SilentlyContinue
  [void](EnsureBox); PasteText "hello there"; Keys "{ENTER}"; Start-Sleep -Seconds 3; Crop "d4-resting"; Note "D4 'hello there' with both in: no line must follow"; Note (Lines)
  Keys "^a"; PasteText "call Paws out"; Keys "{ENTER}"; Start-Sleep -Seconds 4; Note "D4 'call Paws out' with both in: Paws must come out"; Note (Dump | Where-Object { $_ -match "^(main|paws)" }); Crop "d4b-called"
} finally {
  $log | Set-Content "$Out\duo-dblclick-log.txt" -Encoding UTF8; $log
  Stop-Process -Id $p.Id -Force
}
