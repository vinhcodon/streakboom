# A live check of the duo talk with the real brains the person plugged in (exp/duo-prototype only). The keys stay in the operating system's credential
# store and are used by the program itself: this script never reads, prints or passes a key. Peak speaks with the active provider, Paws with the one named in
# -PawsProvider (the developer flag STREAKBOOM_PAWS_PROVIDER). The messages are short test lines typed through the developer channel (duo-cmd.txt, ASCII).
# The program is left running at the end so the person can try it; the pictures and the trace go to -Out.
param([string]$Out = "$env:TEMP\duo-live", [string]$PawsProvider = "groq", [string]$Exe = "D:\Claude\projects\streakboom-duo\app\src-tauri\target\release\streakboom.exe")
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing, System.Windows.Forms
Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class Dpi { [DllImport("user32.dll")] public static extern bool SetProcessDPIAware(); }'
[void][Dpi]::SetProcessDPIAware() # full-resolution pictures, as in duo-test.ps1
New-Item -ItemType Directory -Force $Out | Out-Null
$data = "$env:APPDATA\com.streakboom.duospike"
function Cmd($c) { Set-Content -Path "$data\duo-cmd.txt" -Value $c -Encoding ascii; Start-Sleep -Milliseconds 900 }
function Shot($name) {
  $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
  $bmp.Save("$Out\$name.png"); $g.Dispose(); $bmp.Dispose()
}
if (Get-Process streakboom -ErrorAction SilentlyContinue) { throw "a streakboom.exe is already running: not touching it" }
Remove-Item "$data\duo-log.txt" -ErrorAction SilentlyContinue
$env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_PAWS_PROVIDER = $PawsProvider
Remove-Item Env:STREAKBOOM_DUO_FAKE -ErrorAction SilentlyContinue
$p = Start-Process $Exe -PassThru
Start-Sleep 7
$state = Get-Content "$data\duo.json" -ErrorAction SilentlyContinue
if ($state -notmatch '"paws":\{"out":true') { Cmd "call"; Start-Sleep 3 }
function Say($name, $text, $wait) { Cmd "type:$text"; for ($i = 1; $i -le $wait; $i++) { Start-Sleep -Seconds 2; Shot ("{0}-{1:d2}" -f $name, $i) } }
Say "a-to-paws" "Paws, how is your day going?" 6
Say "b-to-both" "how are you both feeling about the afternoon?" 10
Say "c-to-peak" "Peak, what do you think of Paws?" 6
Start-Sleep 5
$log = Get-Content "$data\duo-log.txt" -ErrorAction SilentlyContinue | Where-Object { $_ -match " (line|brain)" }
$log | Set-Content "$Out\duo-live-log.txt"
$log
"left running: pid $($p.Id)"
