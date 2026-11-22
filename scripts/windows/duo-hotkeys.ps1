# The two global shortcuts of the duo prototype (ADR-0142, step 3), exp/duo-prototype only: that they are registered with Windows, that a combination another program holds is refused,
# that the real keys (Ctrl+Alt+P, Ctrl+Alt+Shift+P) show the chat box and send everyone in, and the Settings section. Keys are sent only after the program reports both registered:
# a registered combination is taken by Windows before any window sees it, so it cannot reach the person's own programs. Canned replies; no brain, no key.
param([string]$Out = "$env:TEMP\duo-hotkeys", [string]$Exe = "D:\Claude\projects\streakboom-duo\app\src-tauri\target\release\streakboom.exe")
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
Add-Type @"
using System; using System.Runtime.InteropServices;
public class H { [DllImport("user32.dll")] public static extern bool RegisterHotKey(IntPtr h, int id, uint mod, uint vk);
  [DllImport("user32.dll")] public static extern bool UnregisterHotKey(IntPtr h, int id); }
"@
function CmdR($c) { Remove-Item "$data\duo-cmd-result.txt" -ErrorAction SilentlyContinue; Cmd $c; Start-Sleep -Milliseconds 500; if (Test-Path "$data\duo-cmd-result.txt") { Get-Content "$data\duo-cmd-result.txt" } else { "$c -> no result" } }
$log = @(); function Note($t) { $script:log += $t }
if (Get-Process streakboom -ErrorAction SilentlyContinue) { throw "a streakboom.exe is already running: not touching it" }
Remove-Item "$data\duo-keys.json", "$data\duo-log.txt" -ErrorAction SilentlyContinue
$env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_DUO_FAKE = "1"
$p = Start-Process $Exe -PassThru; Start-Sleep 7
try {
  if ((Get-Content "$data\duo.json" -ErrorAction SilentlyContinue) -notmatch '"paws":\{"out":true') { Cmd "call"; Start-Sleep 3 }
  $d = Dump; Note "H0 registered?"; Note ($d | Where-Object { $_ -match "^hotkeys" })
  if (-not (($d | Where-Object { $_ -match "^hotkeys" }) -match "ok=True.*ok=True")) { throw "the two shortcuts are not both registered: no key is sent" }
  # H1 a combination another program holds is refused, the old one stays
  [void][H]::RegisterHotKey([IntPtr]::Zero, 77, 0x0003, 0x78)   # Ctrl+Alt+F9 held by this script
  Note (CmdR "setkey:box:Ctrl+Alt+F9"); Note (Dump | Where-Object { $_ -match "^hotkeys" })
  Note (CmdR "setkey:box:Ctrl+Alt+7"); Note (Dump | Where-Object { $_ -match "^hotkeys" })
  Note (CmdR "setkey:all:Ctrl+Alt+7")       # equals the other one (after the box took it)
  Note (CmdR "setkey:box:P")                # no modifier
  Note (CmdR "setkey:box:Shift+P")          # Shift alone
  [void][H]::UnregisterHotKey([IntPtr]::Zero, 77)
  Note (CmdR "setkey:box:Ctrl+Alt+F9")      # free now
  Note (CmdR "setkey:box:Ctrl+Alt+P"); Note (Dump | Where-Object { $_ -match "^hotkeys" }); Note "duo-keys.json:"; Note (Get-Content "$data\duo-keys.json")
  # H2 the real keys
  $d = Dump; Note "H2 before the keys: box and pets"; Note ($d | Where-Object { $_ -match "^(main|paws|chatbox|hotkeys)" })
  [System.Windows.Forms.SendKeys]::SendWait("^%p"); Start-Sleep -Milliseconds 1800; Note "H2 after Ctrl+Alt+P: the box shows"; Note (Dump | Where-Object { $_ -match "^chatbox" }); Shot "h2a-box-shown"
  [System.Windows.Forms.SendKeys]::SendWait("^%p"); Start-Sleep -Milliseconds 1500; Note "H2 after Ctrl+Alt+P again: the box hides"; Note (Dump | Where-Object { $_ -match "^chatbox" })
  [System.Windows.Forms.SendKeys]::SendWait("^%+p"); Start-Sleep -Milliseconds 2800; Note "H2 after Ctrl+Alt+Shift+P: everyone goes in"; Note (Dump | Where-Object { $_ -match "^(main|paws)" }); Shot "h2b-all-in"
  [System.Windows.Forms.SendKeys]::SendWait("^%+p"); Start-Sleep -Milliseconds 2800; Note "H2 after Ctrl+Alt+Shift+P again: the last one comes out"; Note (Dump | Where-Object { $_ -match "^(main|paws)" }); Shot "h2c-last-out"
  # H3 the Settings section (no clicks)
  Cmd "opensettings"; Start-Sleep -Seconds 4; Shot "h3-settings"
} finally {
  $log | Set-Content "$Out\duo-hotkeys-log.txt" -Encoding UTF8; $log
  Stop-Process -Id $p.Id -Force; Remove-Item "$data\duo-keys.json" -ErrorAction SilentlyContinue
}
