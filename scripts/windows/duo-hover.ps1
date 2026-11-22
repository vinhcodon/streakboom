# ADR-0147 step 1, exp/duo-prototype only: the chat box as the ambient log (transparent, click-through, no focus, pills, fading) and engaged (solid, keyboard). Canned replies, no key.
# Clicks only inside the windows of the program under test; keys only while it has the keyboard. No click is made on the ambient box (it is click-through: that is the point).
# Clicks only inside the windows of the program under test; keys only while it has the keyboard.
param([string]$Out = "$env:TEMP\duo-ambient", [string]$Exe = "D:\Claude\projects\streakboom-duo\app\src-tauri\target\release\streakboom.exe")
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
function Front0 { $h = [W]::GetForegroundWindow(); $sb = New-Object System.Text.StringBuilder 256; [void][W]::GetWindowText($h, $sb, 256); $q = [uint32]0; [void][M]::GetWindowThreadProcessId($h, [ref]$q); $p = Get-Process -Id $q -ErrorAction SilentlyContinue; "hwnd=$($h.ToInt64()) own=$($p -and $p.Path -eq $Exe) title='$($sb.ToString())'" }
Add-Type @"
using System; using System.Text; using System.Runtime.InteropServices;
public class W2 { public delegate bool CB(IntPtr h, IntPtr l); [DllImport("user32.dll")] public static extern bool EnumWindows(CB cb, IntPtr l); [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p); [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  public static IntPtr Find(int pid, string title) { IntPtr r = IntPtr.Zero; EnumWindows((h, l) => { uint q; GetWindowThreadProcessId(h, out q); var sb = new StringBuilder(256); GetWindowText(h, sb, 256); if (q == pid && sb.ToString() == title) { r = h; return false; } return true; }, IntPtr.Zero); return r; } }
public class X { [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindowW(string c, string t);
  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr h, int i); }
"@
function BoxStyleOld { $h = [X]::FindWindowW($null, "Streakboom chat"); if ($h -eq [IntPtr]::Zero) { return "no window" }; $e = [X]::GetWindowLong($h, -20); "transparent(click-through)=$(($e -band 0x20) -ne 0) noactivate=$(($e -band 0x08000000) -ne 0)" }
function ForegroundIsOwn { $h = [M]::GetForegroundWindow(); $q = [uint32]0; [void][M]::GetWindowThreadProcessId($h, [ref]$q); $pr = Get-Process -Id $q -ErrorAction SilentlyContinue; return [bool]($pr -and $pr.Path -eq $Exe) }
function ForegroundIsBox { $h = [M]::GetForegroundWindow(); $b = [W2]::Find($p.Id, "Streakboom chat"); return ($b -ne [IntPtr]::Zero -and $h -eq $b) }
function CropBox($name) { $b = Rect4 (Dump) "chatbox"; if (-not ($b -and $b.v)) { Note "$name : the box window is not showing"; return }; $s = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object System.Drawing.Bitmap $s.Width, $s.Height; $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($s.Location, [System.Drawing.Point]::Empty, $s.Size); $g.Dispose(); $c = $bmp.Clone((New-Object System.Drawing.Rectangle $b.x, $b.y, $b.w, $b.h), $bmp.PixelFormat); $c.Save("$Out\$name.png"); $c.Dispose(); $bmp.Dispose() }
$log = @(); function Note($t) { $script:log += $t }
if (Get-Process streakboom -ErrorAction SilentlyContinue) { throw "a streakboom.exe is already running: not touching it" }
Remove-Item "$data\duo-log.txt", "$data\duo.json" -ErrorAction SilentlyContinue
$env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_DUO_FAKE = "1"
$p = Start-Process $Exe -PassThru; Start-Sleep 7
function BoxStyle { $h = [W2]::Find($p.Id, "Streakboom chat"); if ($h -eq [IntPtr]::Zero) { return "no window" }; $e = [X]::GetWindowLong($h, -20); "transparent(click-through)=$(($e -band 0x20) -ne 0) noactivate=$(($e -band 0x08000000) -ne 0)" }
try {
  Cmd "call"; Start-Sleep 3
  Cmd "hotbox"; Start-Sleep 2
  PasteText "@Paws Chắc lại đói bụng chứ gì"; Keys "{ENTER}"; Start-Sleep -Milliseconds 2500
  Cmd "hotbox"; Start-Sleep -Milliseconds 1500
  Note "H1 reading (pinned, pills alive): $(BoxStyle)"
  $b = Rect4 (Dump) "chatbox"; Note "box rect: $($b.x),$($b.y) $($b.w)x$($b.h) visible=$($b.v)"
  [void][M]::SetCursorPos($b.x + 250, $b.y + [int]($b.h / 2)); Start-Sleep -Milliseconds 300; Note "cursor now: $([System.Windows.Forms.Cursor]::Position)"; Start-Sleep -Milliseconds 400
  Note "H2 pointer on the box for 0.7 s (engaged without focus): $(BoxStyle); the box is the foreground window = $(ForegroundIsBox)"
  CropBox "h2-hover"
  [void][M]::SetCursorPos($b.x - 200, $b.y + 200); Start-Sleep -Milliseconds 300; Note "cursor now: $([System.Windows.Forms.Cursor]::Position)"; Start-Sleep -Milliseconds 1200
  Note "H3 pointer away for 1.5 s, field empty (back to reading): $(BoxStyle)"
  [void][M]::SetCursorPos($b.x + 250, $b.y + [int]($b.h / 2)); Start-Sleep -Milliseconds 600
  $b = Rect4 (Dump) "chatbox"; Click ($b.x + 150) ($b.y + $b.h - 30); Start-Sleep -Milliseconds 600
  Note "H4 clicked into the field: the box is the foreground window = $(ForegroundIsBox); keyboard in the program = $(ProgramHasFocus)"
  PasteText "abc"; [void][M]::SetCursorPos($b.x - 200, $b.y + 200); Start-Sleep -Milliseconds 1500
  Note "H5 pointer away with a draft in the field: stays engaged: $(BoxStyle)"
  CropBox "h5-draft"
} finally { $log; Stop-Process -Id $p.Id -Force }
