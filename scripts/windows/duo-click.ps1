# A check of the duo prototype with the real mouse and the real keyboard (exp/duo-prototype only): a double click on Paws opens the chat for it, a click on a
# chip changes who the box is for, text typed with the keyboard goes through the real chat box. Replies are canned (STREAKBOOM_DUO_FAKE): no brain, no key.
# Step "start" launches the program and leaves it running; the other steps act on the running program. Pictures and the trace go to -Out.
param([ValidateSet("start", "dblclick", "click", "type", "flow", "stop")][string]$Step, [int]$InX = 0, [int]$InY = 0, [string]$Out = "$env:TEMP\duo-click", [string]$Who = "paws", [int]$X = 0, [int]$Y = 0, [string]$Text = "",
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
function Cmd($c) { Set-Content -Path "$data\duo-cmd.txt" -Value $c -Encoding ascii; Start-Sleep -Milliseconds 900 }
function Dump { Remove-Item "$data\duo-dump.txt" -ErrorAction SilentlyContinue; Cmd "dump"; Start-Sleep -Milliseconds 500; Get-Content "$data\duo-dump.txt" }
function Shot($name) {
  $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
  $bmp.Save("$Out\$name.png"); $g.Dispose(); $bmp.Dispose()
}
# Keys are sent only when the window that has the keyboard belongs to the program under test: never into whatever else is in front (the person's own windows).
function ProgramHasFocus { $pid2 = [uint32]0; [void][M]::GetWindowThreadProcessId([M]::GetForegroundWindow(), [ref]$pid2); $q = Get-Process -Id $pid2 -ErrorAction SilentlyContinue; return ($q -and $q.Path -eq $Exe) }
function RawClick($x, $y) { [M]::SetCursorPos($x, $y); Start-Sleep -Milliseconds 120; [M]::mouse_event(2,0,0,0,[IntPtr]::Zero); Start-Sleep -Milliseconds 50; [M]::mouse_event(4,0,0,0,[IntPtr]::Zero) }
function Rect4($dump, $label) { $l = $dump | Where-Object { $_ -like "$label *" }; if ($l -match 'visible=(w+) pos=Some(((-?d+), (-?d+))) size=Some(((d+), (d+)))') { @{ v = ($matches[1] -eq "true"); x = [int]$matches[2]; y = [int]$matches[3]; w = [int]$matches[4]; h = [int]$matches[5] } } }
# A click is made only inside a window of the program under test, checked against the windows at that moment: never on whatever else is on the screen (the person's own windows).
function Click($x, $y) {
  $d = Dump; $ok = $false
  foreach ($lab in @("main", "paws", "chatbox", "bubble")) { $r = Rect4 $d $lab; if ($r -and $r.v -and $x -ge $r.x -and $x -le $r.x + $r.w -and $y -ge $r.y -and $y -le $r.y + $r.h) { $ok = $true } }
  if ($ok) { RawClick $x $y } else { Write-Output "click at $x,$y skipped: not inside a window of the program under test" }
}
function Rect($dump, $label) { $l = $dump | Where-Object { $_ -like "$label *" }; if ($l -match 'pos=Some\(\((-?\d+), (-?\d+)\)\)') { [int]$matches[1], [int]$matches[2] } }
switch ($Step) {
  "start" {
    if (Get-Process streakboom -ErrorAction SilentlyContinue) { throw "a streakboom.exe is already running: not touching it" }
    Remove-Item "$data\duo-log.txt" -ErrorAction SilentlyContinue
    $env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_DUO_FAKE = "1"
    $p = Start-Process $Exe -PassThru; Start-Sleep 7
    if ((Get-Content "$data\duo.json" -ErrorAction SilentlyContinue) -notmatch '"paws":\{"out":true') { Cmd "call"; Start-Sleep 3 }
    Dump; Shot "start"; "pid $($p.Id)"
  }
  "dblclick" {  # on the pet named in -Who, at the middle of its art (window 140 logical, art at about 70,85 logical; scale 1.25 here)
    $d = Dump; $label = if ($Who -eq "paws") { "paws" } else { "main" }; $r = Rect $d $label
    $cx = $r[0] + 87; $cy = $r[1] + 106
    Click $cx $cy; Start-Sleep -Milliseconds 90; Click $cx $cy
    Start-Sleep -Milliseconds 1800; Dump; Shot "dblclick-$Who"
  }
  "click" { Click $X $Y; Start-Sleep -Milliseconds 800; Shot "click-$X-$Y" }
  "type"  { if (-not (ProgramHasFocus)) { throw "the program under test does not have the keyboard: nothing typed" }; [System.Windows.Forms.SendKeys]::SendWait($Text + "{ENTER}"); for ($i = 1; $i -le 6; $i++) { Start-Sleep -Seconds 2; Shot ("type-{0:d2}" -f $i) }; Get-Content "$data\duo-log.txt" | Where-Object { $_ -match " line " } }
  "flow"  {  # one go, because the chat box closes by itself when left alone: double click on -Who, click the chip at -X -Y, click the input at -InX -InY, type -Text
    $d = Dump; $label = if ($Who -eq "paws") { "paws" } else { "main" }; $r = Rect $d $label
    $cx = $r[0] + 87; $cy = $r[1] + 106
    Click $cx $cy; Start-Sleep -Milliseconds 90; Click $cx $cy
    Start-Sleep -Milliseconds 1500; $d2 = Dump; Shot "flow-1-opened"; $d2 | Where-Object { $_ -match "^(main|paws|bubble)" }
    if ($X -gt 0) { Click $X $Y; Start-Sleep -Milliseconds 600; Shot "flow-2-chip" }
    if ($InX -gt 0) { Click $InX $InY; Start-Sleep -Milliseconds 500 }
    if ($InX -eq -1) { $b = Rect (Dump) "bubble"; Click ($b[0] + 134) ($b[1] + 75); Start-Sleep -Milliseconds 500; Shot "flow-2b-input" }  # the box may have moved to the other pet: find it
    if ($Text -ne "") {
      if (-not (ProgramHasFocus)) { "the program under test does not have the keyboard: nothing typed"; Shot "flow-3-nofocus"; return }
      [System.Windows.Forms.SendKeys]::SendWait($Text + "{ENTER}")
      for ($i = 1; $i -le 6; $i++) { Start-Sleep -Seconds 2; Shot ("flow-4-{0:d2}" -f $i) }
      Get-Content "$data\duo-log.txt" -ErrorAction SilentlyContinue | Where-Object { $_ -match " line " }
    }
  }
  "stop"  { Get-Process streakboom -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $Exe } | Stop-Process -Force; "stopped" }
}
