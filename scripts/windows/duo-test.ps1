# The automatic check of the duo prototype (exp/duo-prototype only). Starts the release build of the prototype with STREAKBOOM_DUO=1 under its own
# identifier (com.streakboom.duospike, never the real data folder), drives it through the developer channel duo-cmd.txt (no menu clicks), reads the
# windows from duo-dump.txt, takes pictures of the screen, clicks Peak with the mouse, and writes everything to an output folder.
param([string]$Out = "$env:TEMP\duo-test", [string]$Exe = "D:\Claude\projects\streakboom-duo\app\src-tauri\target\release\streakboom.exe")
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing, System.Windows.Forms
Add-Type @"
using System; using System.Runtime.InteropServices;
public class Mouse { [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint d, IntPtr e);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware(); }
"@
[void][Mouse]::SetProcessDPIAware()
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
function Click($x, $y) { [Mouse]::SetCursorPos($x, $y); Start-Sleep -Milliseconds 100; [Mouse]::mouse_event(2,0,0,0,[IntPtr]::Zero); Start-Sleep -Milliseconds 60; [Mouse]::mouse_event(4,0,0,0,[IntPtr]::Zero) }
function Drag($x1, $y1, $x2, $y2) { [Mouse]::SetCursorPos($x1, $y1); Start-Sleep -Milliseconds 150; [Mouse]::mouse_event(2,0,0,0,[IntPtr]::Zero); for ($i = 1; $i -le 12; $i++) { [Mouse]::SetCursorPos([int]($x1 + ($x2-$x1)*$i/12), [int]($y1 + ($y2-$y1)*$i/12)); Start-Sleep -Milliseconds 40 }; [Mouse]::mouse_event(4,0,0,0,[IntPtr]::Zero) }
function Rect($dump, $label) { $l = $dump | Where-Object { $_ -like "$label *" }; if ($l -match 'pos=Some\(\((-?\d+), (-?\d+)\)\)') { [int]$matches[1], [int]$matches[2] } }

if (Get-Process streakboom -ErrorAction SilentlyContinue) { throw "a streakboom.exe is already running: not touching it" }
Remove-Item "$data\duo.json", "$data\duo-log.txt" -ErrorAction SilentlyContinue
$env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_DUO_FAKE = "1"
$p = Start-Process $Exe -PassThru
Start-Sleep 7
$log = @()
$d = Dump; $log += "T1 start"; $log += $d; Shot "t1-start"
Cmd "call"; Start-Sleep 2
$d = Dump; $log += "T2 call"; $log += $d; Shot "t2-called"
for ($try = 0; $try -lt 5; $try++) {
  $d = Dump; $pk = Rect $d "main"; $pw = Rect $d "paws"
  if ($pk -and $pw -and [Math]::Abs($pk[1] - $pw[1]) -le 40) { break }
  if ($pk) { Drag ($pk[0] + 87) ($pk[1] + 100) ($pk[0] + 87) 1020; Start-Sleep 4 }  # the person puts Peak on the floor, as the scenes need
}
$d = Dump; $log += "T2b Peak dropped to the floor"; $log += $d
Cmd "scene"
$t0 = Get-Date
for ($i = 0; $i -lt 9; $i++) { Start-Sleep -Seconds 3; $d = Dump; $log += "T3 scene tidy-ball +$([int]((Get-Date)-$t0).TotalSeconds)s"; $log += $d; Shot ("t3-tidy-{0:d2}" -f $i) }
Start-Sleep 4
Cmd "scene:shift-away"; for ($i = 0; $i -lt 6; $i++) { Start-Sleep -Seconds 3; $d = Dump; $log += "T3b shift-away +$((($i+1)*3))s"; $log += $d; Shot ("t3b-shift-{0:d2}" -f $i) }
Start-Sleep 4
Cmd "scene:roll"; for ($i = 0; $i -lt 5; $i++) { Start-Sleep -Seconds 3; $d = Dump; $log += "T3c roll +$((($i+1)*3))s"; $log += $d; Shot ("t3c-roll-{0:d2}" -f $i) }
Start-Sleep 4
Cmd "scene:roll"; Start-Sleep 4; $d = Dump; $log += "T4 roll running (ball must be there)"; $log += $d; Shot "t4-before-touch"
$pk = Rect $d "main"; if ($pk) { Click ($pk[0] + 70) ($pk[1] + 90) }
Start-Sleep -Seconds 2; $d = Dump; $log += "T4 after a click on Peak (ball must be gone)"; $log += $d; Shot "t4-after-touch"
Cmd "tray"; Start-Sleep 2; $d = Dump; $log += "T5 tray: everyone goes in"; $log += $d; Shot "t5-tray-in"
Cmd "tray"; Start-Sleep 2; $d = Dump; $log += "T5 tray again: the last one comes out"; $log += $d; Shot "t5-tray-out"
# T6: the state is restored at the next start
Cmd "call"; Start-Sleep 3; $d = Dump; $log += "T6 before the restart"; $log += $d
Stop-Process -Id $p.Id -Force; Start-Sleep 2
$log += "T6 duo.json before the restart"; $log += (Get-Content "$data\duo.json")
$p = Start-Process $Exe -PassThru; Start-Sleep 7
$d = Dump; $log += "T6 after the restart (the same pets are out)"; $log += $d; Shot "t6-restored"
# T7: the chat commands (without the chat box): Paws in and out where it went in, Peak in, a refusal when nobody asks it
function CmdR($c) { Remove-Item "$data\duo-cmd-result.txt" -ErrorAction SilentlyContinue; Cmd $c; Start-Sleep -Milliseconds 400; if (Test-Path "$data\duo-cmd-result.txt") { Get-Content "$data\duo-cmd-result.txt" } else { "no result" } }
$log += "T7 start: both out"; $log += (Dump)
$log += (CmdR "cmd:paws:in"); Start-Sleep 2; $log += "T7 Paws sent in"; $log += (Dump); Shot "t7-paws-in"
$log += (CmdR "cmd:paws:in"); $log += "T7 (a second send-in must be ok=False)"
$log += (CmdR "cmd:paws:out"); Start-Sleep 2; $log += "T7 Paws called out again"; $log += (Dump); Shot "t7-paws-out"
$log += (CmdR "cmd:peak:in"); Start-Sleep 2; $log += "T7 Peak sent in, Paws stays"; $log += (Dump); Shot "t7-peak-in"
$log += (CmdR "cmd:peak:out"); $log += "T7 (Peak out must be ok=False: Peak is not the pet on the screen to call)"
# T8: the bubble belongs to the pet that answers (a line said as Paws without the model: the persona and the key are not exercised here)
Cmd "call"; Start-Sleep 3  # Paws is out alone: it calls Peak back
$d = Dump; $log += "T8 state before"; $log += $d
Cmd "say:paws:Duty is done, and the cushion is in perfect order."; Start-Sleep 2.5; $d = Dump; $log += "T8 Paws speaks: the bubble must stand next to Paws"; $log += $d; Shot "t8-paws-says"
Start-Sleep 9
Cmd "say:peak:A plain line from Peak."; Start-Sleep 2.5; $d = Dump; $log += "T8 Peak speaks: the bubble must stand next to Peak"; $log += $d; Shot "t8-peak-says"
# T9: the talk with canned replies (STREAKBOOM_DUO_FAKE, no key): routing, one line at a time, the bubble beside the speaker, a nod for a pass, an aside
function Talk($name, $text, $n) {
  Start-Sleep 6  # the bubble of the last line is gone
  Cmd "type:$text"
  for ($i = 0; $i -lt $n; $i++) { Start-Sleep -Milliseconds 1100; $d = Dump; $script:log += "T9 $name +$i"; $script:log += $d; Shot ("t9-{0}-{1:d2}" -f $name, $i) }
}
Talk "to-paws" "Paws, how is your day" 3
Talk "to-both" "how are you both" 6
Talk "both-pass" "how are you both pass" 6
Talk "both-aside" "how are you both aside" 6
Talk "to-peak" "Peak, and you?" 2
# T10: a relay: one pet turns to the other, which answers the person (one call, no line for the asker)
Talk "relay-paws" "ask Paws what he did today" 5
Talk "relay-peak" "ask Peak how he feels" 5
Stop-Process -Id $p.Id -Force
$log += "duo-log.txt"; $log += (Get-Content "$data\duo-log.txt" -ErrorAction SilentlyContinue)
$log | Set-Content "$Out\duo-test-log.txt"
"done: $Out"
