# The whole talk with the real brains the person plugged in, driven by the real mouse and keyboard (exp/duo-prototype only). The keys stay in the operating system's
# credential store and are used by the program itself; this script never reads, prints or passes a key. Peak speaks with the active provider, Paws with
# -PawsProvider (the developer flag STREAKBOOM_PAWS_PROVIDER). Text is pasted (the clipboard is saved and restored), so a typing mode such as Telex cannot change it,
# and it is pasted only when the program under test has the keyboard: never into another window. Pictures, strips of frames and the trace go to -Out.
param([string]$Out = "$env:TEMP\duo-live2", [string]$PawsProvider = "groq", [switch]$KeepRunning, [string[]]$Steps = @("s1", "s2", "s3", "s4"),
      [string]$Exe = "D:\Claude\projects\streakboom-duo\app\src-tauri\target\release\streakboom.exe")
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
function Cmd($c) { Set-Content -Path "$data\duo-cmd.txt" -Value $c -Encoding ascii; Start-Sleep -Milliseconds 700 }
function Dump { Remove-Item "$data\duo-dump.txt" -ErrorAction SilentlyContinue; Cmd "dump"; Start-Sleep -Milliseconds 400; Get-Content "$data\duo-dump.txt" }
function Rect4($dump, $label) { $l = $dump | Where-Object { $_ -like "$label *" }; if ($l -match 'visible=(\w+) pos=Some\(\((-?\d+), (-?\d+)\)\) size=Some\(\((\d+), (\d+)\)\)') { @{ v = ($matches[1] -eq "true"); x = [int]$matches[2]; y = [int]$matches[3]; w = [int]$matches[4]; h = [int]$matches[5] } } }
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
function Grab() { $bmp = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height; $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size); $g.Dispose(); $bmp }
function Shot($name) { $b = Grab; $b.Save("$Out\$name.png"); $b.Dispose() }
function RawClick($x, $y) { [M]::SetCursorPos($x, $y); Start-Sleep -Milliseconds 120; [M]::mouse_event(2,0,0,0,[IntPtr]::Zero); Start-Sleep -Milliseconds 50; [M]::mouse_event(4,0,0,0,[IntPtr]::Zero) }
# A click is made only inside a window of the program under test, checked against the windows at that moment: never on whatever else is on the screen (the person's own windows).
function Click($x, $y) {
  $d = Dump; $ok = $false
  foreach ($lab in @("main", "paws", "chatbox", "bubble")) { $r = Rect4 $d $lab; if ($r -and $r.v -and $x -ge $r.x -and $x -le $r.x + $r.w -and $y -ge $r.y -and $y -le $r.y + $r.h) { $ok = $true } }
  if ($ok) { RawClick $x $y } else { Write-Output "click at $x,$y skipped: not inside a window of the program under test" }
}
function ProgramHasFocus { $q = [uint32]0; [void][M]::GetWindowThreadProcessId([M]::GetForegroundWindow(), [ref]$q); $p = Get-Process -Id $q -ErrorAction SilentlyContinue; return ($p -and $p.Path -eq $Exe) }
# a strip of frames around the pets while something happens, as one picture
function Strip($name, $seconds) {
  $d = Dump; $rs = @("main", "paws", "bubble") | ForEach-Object { Rect4 $d $_ } | Where-Object { $_ -and $_.v }
  $x1 = ($rs | ForEach-Object { $_.x } | Measure-Object -Minimum).Minimum - 30; $y1 = ($rs | ForEach-Object { $_.y } | Measure-Object -Minimum).Minimum - 20
  $x2 = ($rs | ForEach-Object { $_.x + $_.w } | Measure-Object -Maximum).Maximum + 30; $y2 = ($rs | ForEach-Object { $_.y + $_.h } | Measure-Object -Maximum).Maximum + 10
  $x1 = [Math]::Max(0, $x1); $y1 = [Math]::Max(0, $y1); $x2 = [Math]::Min($screen.Width, $x2); $y2 = [Math]::Min($screen.Height, $y2)
  $w = $x2 - $x1; $h = $y2 - $y1; $frames = @(); $t0 = Get-Date
  while (((Get-Date) - $t0).TotalSeconds -lt $seconds) {
    $b = Grab; $crop = $b.Clone((New-Object System.Drawing.Rectangle $x1, $y1, $w, $h), $b.PixelFormat); $b.Dispose(); $frames += $crop; Start-Sleep -Milliseconds 650
  }
  $cols = 3; $rows = [Math]::Ceiling($frames.Count / $cols); $sw = [int]($w * 0.55); $sh = [int]($h * 0.55)
  $sheet = New-Object System.Drawing.Bitmap ($sw * $cols), ($sh * $rows); $g = [System.Drawing.Graphics]::FromImage($sheet); $g.Clear([System.Drawing.Color]::White)
  for ($i = 0; $i -lt $frames.Count; $i++) { $g.DrawImage($frames[$i], ($i % $cols) * $sw, [Math]::Floor($i / $cols) * $sh, $sw, $sh); $frames[$i].Dispose() }
  $sheet.Save("$Out\$name.png"); $g.Dispose(); $sheet.Dispose()
}
function PasteAndSend($text) {
  if (-not (ProgramHasFocus)) { throw "the program under test does not have the keyboard: nothing pasted" }
  $old = $null; try { $old = [System.Windows.Forms.Clipboard]::GetText() } catch {}
  [System.Windows.Forms.Clipboard]::SetText($text)
  [System.Windows.Forms.SendKeys]::SendWait("^v"); Start-Sleep -Milliseconds 300; [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
  Start-Sleep -Milliseconds 300; if ($old) { [System.Windows.Forms.Clipboard]::SetText($old) } else { [System.Windows.Forms.Clipboard]::Clear() }
}
# open the box by a double click on a pet, optionally click a chip (peak, paws, both), then say the text and watch for -Watch seconds
function Say($step, $pet, $chip, $text, $watch) {
  $d = Dump; $r = Rect4 $d ($(if ($pet -eq "paws") { "paws" } else { "main" }))
  $cx = $r.x + 87; $cy = $r.y + 106
  Click $cx $cy; Start-Sleep -Milliseconds 90; Click $cx $cy; Start-Sleep -Milliseconds 1500
  $b = Rect4 (Dump) "bubble"; if (-not $b.v) { "$step : the box did not open"; Shot "$step-nobox"; return }
  $mid = $b.x + [int]($b.w / 2); $bottom = $b.y + $b.h
  Shot "$step-1-open"
  if ($chip) { $dx = @{ peak = -56; paws = 0; both = 56 }[$chip]; Click ($mid + $dx) ($bottom - 80); Start-Sleep -Milliseconds 700
               $b = Rect4 (Dump) "bubble"; $mid = $b.x + [int]($b.w / 2); $bottom = $b.y + $b.h; Shot "$step-2-chip-$chip" }
  Click $mid ($bottom - 40); Start-Sleep -Milliseconds 500
  PasteAndSend $text
  Strip "$step-3-strip" $watch
}
if (Get-Process streakboom -ErrorAction SilentlyContinue) { throw "a streakboom.exe is already running: not touching it" }
Remove-Item "$data\duo-log.txt" -ErrorAction SilentlyContinue
$env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_PAWS_PROVIDER = $PawsProvider; Remove-Item Env:STREAKBOOM_DUO_FAKE -ErrorAction SilentlyContinue
$p = Start-Process $Exe -PassThru; Start-Sleep 7
if ((Get-Content "$data\duo.json" -ErrorAction SilentlyContinue) -notmatch '"paws":\{"out":true') { Cmd "call"; Start-Sleep 3 }
Shot "0-start"
if ($Steps -contains "s1") { Say "s1-to-paws"   "paws" $null  "Paws, how is your day going?" 9 }
if ($Steps -contains "s2") { Say "s2-both"      "paws" "both" "How are you both feeling about the afternoon?" 15 }
if ($Steps -contains "s3") { Say "s3-relay"     "peak" $null  "Peak, ask Paws what he did today" 12 }
if ($Steps -contains "s4") { Say "s4-to-peak"   "peak" "peak" "Peak, what do you think of Paws?" 9 }
# the log: open the box once more and read the picture
$d = Dump; $r = Rect4 $d "main"; Click ($r.x + 87) ($r.y + 106); Start-Sleep -Milliseconds 90; Click ($r.x + 87) ($r.y + 106); Start-Sleep -Milliseconds 1800; Shot "s5-log"
Get-Content "$data\duo-log.txt" -ErrorAction SilentlyContinue | Where-Object { $_ -match " (line|brain)" } | Set-Content "$Out\duo-live2-log.txt" -Encoding UTF8
Get-Content "$Out\duo-live2-log.txt" -Encoding UTF8 | ForEach-Object { $_ -replace '^\d+ ', '' }
if ($KeepRunning) { "left running: pid $($p.Id)" } else { Stop-Process -Id $p.Id -Force; "stopped" }
