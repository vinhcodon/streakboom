# The keys of the chat box of the duo prototype (ADR-0142, step 2), exp/duo-prototype only: arrow up recalls, Esc clears, Tab and Ctrl+1/2/3 change the recipient,
# Shift+Enter breaks the line, / opens the list of commands. Real keys, only while the program under test has the keyboard; clicks only inside its own windows.
# Canned replies (STREAKBOOM_DUO_FAKE): no brain, no key.
param([string]$Out = "$env:TEMP\duo-keys", [string]$Exe = "D:\Claude\projects\streakboom-duo\app\src-tauri\target\release\streakboom.exe")
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
function EnsureBox { $r = Rect4 (Dump) "chatbox"; if (-not ($r -and $r.v)) { Cmd "traysingle"; Start-Sleep -Milliseconds 1500; $r = Rect4 (Dump) "chatbox" }; $r }
function Focus { for ($k = 0; $k -lt 4 -and -not (ProgramHasFocus); $k++) { $bb = EnsureBox; if ($bb -and $bb.v) { Click ($bb.x + [int]($bb.w / 2) - 20) ($bb.y + $bb.h - 40); Start-Sleep -Milliseconds 500 } }; if (-not (ProgramHasFocus)) { Shot "nofocus"; throw "the program under test does not have the keyboard: nothing sent" } }
function Keys($seq) { Focus; [System.Windows.Forms.SendKeys]::SendWait($seq); Start-Sleep -Milliseconds 450 }
function PasteText($text) {
  Focus; $old = $null; try { $old = [System.Windows.Forms.Clipboard]::GetText() } catch {}
  $ok = $false; for ($k = 0; $k -lt 8 -and -not $ok; $k++) { try { [System.Windows.Forms.Clipboard]::SetText($text); $ok = $true } catch { Start-Sleep -Milliseconds 250 } }; if (-not $ok) { throw "the clipboard stayed busy: nothing pasted" }
  [System.Windows.Forms.SendKeys]::SendWait("^v"); Start-Sleep -Milliseconds 350
  try { if ($old) { [System.Windows.Forms.Clipboard]::SetText($old) } else { [System.Windows.Forms.Clipboard]::Clear() } } catch {}
}
$log = @()
function Note($t) { $script:log += $t }
if (Get-Process streakboom -ErrorAction SilentlyContinue) { throw "a streakboom.exe is already running: not touching it" }
Remove-Item "$data\duo-log.txt" -ErrorAction SilentlyContinue
$env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_DUO_FAKE = "1"; Remove-Item Env:STREAKBOOM_PAWS_PROVIDER -ErrorAction SilentlyContinue
$p = Start-Process $Exe -PassThru; Start-Sleep 7
try {
  if ((Get-Content "$data\duo.json" -ErrorAction SilentlyContinue) -notmatch '"paws":\{"out":true') { Cmd "call"; Start-Sleep 3 }
  Cmd "traysingle"; Start-Sleep -Milliseconds 1500
  Cmd "pinbox"   # pinned without a click: the person's own windows may take the focus
  Note "K0 box shown and pinned"; Note (Dump | Where-Object { $_ -match "^(main|paws|chatbox)" }); Shot "k0-start"
  # K1 a message, then arrow up recalls it, Esc clears the field and keeps the box
  PasteText "hello"; Keys "{ENTER}"; Start-Sleep -Seconds 4; Shot "k1-sent"
  Keys "{UP}"; Shot "k2-recalled"
  Keys "{ESC}"; Shot "k2b-escaped"; Note "K2 after Esc the box must still be visible"; Note (Dump | Where-Object { $_ -match "^chatbox" })
  # K3 the recipient by Tab and by Ctrl+number
  Keys "{TAB}"; Shot "k3a-tab"; Keys "{TAB}"; Shot "k3b-tab"; Keys "+{TAB}"; Shot "k3c-shifttab"; Keys "^1"; Shot "k3d-ctrl1"; Keys "^3"; Shot "k3e-ctrl3"
  # K4 Shift+Enter breaks the line
  PasteText "line one"; Keys "+{ENTER}"; PasteText "line two"; Shot "k4a-two-lines"; Keys "{ENTER}"; Start-Sleep -Seconds 6; Shot "k4b-sent"
  # K5 the list of commands
  Keys "/"; Shot "k5a-slash"; Keys "{DOWN}"; Shot "k5b-down"; Keys "{ESC}"; Shot "k5c-list-closed"; Keys "{ESC}"
  Keys "/"; Keys "{DOWN}{DOWN}{DOWN}"; Shot "k5d-clear-selected"; Keys "{ENTER}"; Start-Sleep -Milliseconds 800; Shot "k5e-cleared"
  Keys "/"; Shot "k5f-menu-again"; Keys "{ENTER}"; Start-Sleep -Milliseconds 2500   # the first item: send Paws in
  Note "K5 after the first item of the list (send Paws in): Paws must be gone"; Note (Dump | Where-Object { $_ -match "^(main|paws|chatbox)" }); Shot "k5g-paws-in"
  Keys "/"; Shot "k5h-menu-paws-away"; Keys "{ENTER}"; Start-Sleep -Milliseconds 3500   # the first item now: call Paws out
  Note "K5 after the first item again (call Paws out): Paws must be back"; Note (Dump | Where-Object { $_ -match "^(main|paws|chatbox)" }); Shot "k5i-paws-out"
  Note "duo-log"; Note (Get-Content "$data\duo-log.txt" -ErrorAction SilentlyContinue | Where-Object { $_ -match " line " })
} finally {
  $log | Set-Content "$Out\duo-keys-log.txt" -Encoding UTF8; $log
  Stop-Process -Id $p.Id -Force
}
