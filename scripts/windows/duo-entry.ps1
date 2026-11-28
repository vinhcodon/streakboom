# T2a (issue 23, ADR-0167 rows 6, 8, 9): entering a group visit on a RELEASE duo build, canned replies (STREAKBOOM_DUO_FAKE=1), Paws as a chat member
# (STREAKBOOM_PAWS_CHAT=1), no key. Messages go in through the developer command file (type:...); the box is closed with its own close (boxclose); the
# returned text is read back from the box's field with Ctrl+A Ctrl+C typed only into the box of the program under test (the clipboard is put back).
# What it cannot show: a held native save (only a refused one, by the developer channel's [fake:join-fail], and a slow one, [fake:join-slow], 3 s).
param([string]$Out = "$env:TEMP\duo-entry", [string]$Exe = "D:\Claude\projects\streakboom-duo\app\src-tauri\target\release\streakboom.exe")
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
$log = @(); function Note($t) { $script:log += $t; Write-Output $t }
function Cmd($c) { Set-Content -Path "$data\duo-cmd.txt" -Value $c -Encoding ascii; Start-Sleep -Milliseconds 800 }
function Dump { Remove-Item "$data\duo-dump.txt" -ErrorAction SilentlyContinue; Cmd "dump"; Start-Sleep -Milliseconds 400; Get-Content "$data\duo-dump.txt" }
function Rect4($dump, $label) { $l = $dump | Where-Object { $_ -like "$label *" }; if ($l -match 'visible=(\w+) pos=Some\(\((-?\d+), (-?\d+)\)\) size=Some\(\((\d+), (\d+)\)\)') { @{ v = ($matches[1] -eq "true"); x = [int]$matches[2]; y = [int]$matches[3]; w = [int]$matches[4]; h = [int]$matches[5] } } }
function RawClick($x, $y) { [void][M]::SetCursorPos($x, $y); Start-Sleep -Milliseconds 120; [M]::mouse_event(2,0,0,0,[IntPtr]::Zero); Start-Sleep -Milliseconds 50; [M]::mouse_event(4,0,0,0,[IntPtr]::Zero) }
function ProgramHasFocus { $q = [uint32]0; [void][M]::GetWindowThreadProcessId([M]::GetForegroundWindow(), [ref]$q); $p = Get-Process -Id $q -ErrorAction SilentlyContinue; return ($p -and $p.Path -eq $Exe) }
function EnsureBox { $r = Rect4 (Dump) "chatbox"; if (-not ($r -and $r.v)) { Cmd "traysingle"; Start-Sleep -Milliseconds 1500; $r = Rect4 (Dump) "chatbox" }; $r }
# a click only inside the box of the program under test, checked against its window at that moment
function Focus {
  for ($k = 0; $k -lt 4 -and -not (ProgramHasFocus); $k++) { $bb = EnsureBox; if ($bb -and $bb.v) { $x = $bb.x + [int]($bb.w / 2) - 20; $y = $bb.y + $bb.h - 40; $b2 = EnsureBox; if ($b2 -and $b2.v -and $x -ge $b2.x -and $x -le $b2.x + $b2.w -and $y -ge $b2.y -and $y -le $b2.y + $b2.h) { RawClick $x $y }; Start-Sleep -Milliseconds 500 } }
  if (-not (ProgramHasFocus)) { throw "the program under test does not have the keyboard" }
}
function Keys($seq) { Focus; [System.Windows.Forms.SendKeys]::SendWait($seq); Start-Sleep -Milliseconds 450 }
function Draft { Focus | Out-Null; $old = $null; try { $old = [System.Windows.Forms.Clipboard]::GetText() } catch {}; try { [System.Windows.Forms.Clipboard]::Clear() } catch {}; [System.Windows.Forms.SendKeys]::SendWait("^a^c"); Start-Sleep -Milliseconds 400; $t = ""; try { $t = [System.Windows.Forms.Clipboard]::GetText() } catch {}; try { if ($old) { [System.Windows.Forms.Clipboard]::SetText($old) } } catch {}; [System.Windows.Forms.SendKeys]::SendWait("{END}"); ($t -replace "`r", "") -replace "`n", " | " }
function ClearDraft { Keys "^a"; Keys "{BACKSPACE}" }
function LogLines { @(Get-Content "$data\duo-log.txt" -ErrorAction SilentlyContinue | ForEach-Object { $_ -replace '^\d+ ', '' }) }
function Since($m) { @(LogLines | Select-Object -Skip $m) }
function Calls($l) { @($l | Where-Object { $_ -match '^call (peak|paws)' }).Count }
function Member { $d = Get-Content "$data\duo.json" -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json; if ($d) { [bool]$d.pets.paws.out } else { $false } }
function Show($l) { $l | Where-Object { $_ -match '^(entry|call |line |return |paws (joined|left))' } | ForEach-Object { Note "     $_" } }
if (Get-Process streakboom -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $Exe }) { throw "a streakboom.exe is already running: not touching it" }
Remove-Item "$data\duo-log.txt", "$data\duo.json" -ErrorAction SilentlyContinue
$env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_DUO_FAKE = "1"; $env:STREAKBOOM_PAWS_CHAT = "1"
$p = Start-Process $Exe -PassThru; Start-Sleep 8
try {
  Note "exe $Exe sha256 $((Get-FileHash $Exe -Algorithm SHA256).Hash)"
  EnsureBox | Out-Null; Focus
  Note "== N1 an ordinary invitation commits, then its words are sent once"
  $m = (LogLines).Count; Cmd "type:@Paws xin chao"; Start-Sleep 6; $l = Since $m
  Note ("N1 requests={0} member={1}" -f (Calls $l), (Member)); Show $l
  Cmd "cmd:paws:in"; Start-Sleep 3
  Note "== N2 the membership is refused (canned): no request, the text back in the field, the existing line"
  $m = (LogLines).Count; Cmd "type:@Paws [fake:join-fail] are you there"; Start-Sleep 5; $l = Since $m
  Note ("N2 requests={0} member={1} field='{2}'" -f (Calls $l), (Member), (Draft)); Show $l
  ClearDraft
  Note "== N3 a second message waits behind a refused entry: both go back, in order, once"
  $m = (LogLines).Count; Set-Content -Path "$data\duo-cmd.txt" -Value @("type:@Paws [fake:join-fail] first", "type:second message") -Encoding ascii; Start-Sleep 6; $l = Since $m
  Note ("N3 requests={0} member={1} field='{2}'" -f (Calls $l), (Member), (Draft)); Show $l
  ClearDraft
  Note "== N4 the box is closed during the entry (the save is slow, 3 s): nothing commits, the late save is undone, the text is back"
  $m = (LogLines).Count; Cmd "type:@Paws [fake:join-slow] wait for me"; Start-Sleep -Milliseconds 700; Cmd "boxclose"; Start-Sleep 5; $l = Since $m
  Note ("N4 requests={0} member={1}" -f (Calls $l), (Member)); Show $l
  EnsureBox | Out-Null
  Note ("N4 field after reopening='{0}'" -f (Draft))
  ClearDraft
} finally {
  $log | Set-Content -Encoding utf8 "$Out\duo-entry-log.txt"
  Stop-Process -Id $p.Id -Force
}
