# T2d (issue 22, ADR-0167 rows 1, 12, 14a-d, 25 and solo Quiet): the daily count and the call log on a RELEASE duo build (a dev build lifts the chat cap,
# ADR-0122), canned replies (STREAKBOOM_DUO_FAKE=1), no key. Drives the program only through its developer command file (duo-cmd.txt): no click and no key
# goes to any window. The test data's pet.json is backed up first, its usage is seeded per row, and the backup is put back at the end.
# What canned evidence cannot show: the provider's own latency, errors and billing; only the app's gate, its charge before each request and its log.
param([string]$Out = "$env:TEMP\duo-quota", [string]$Exe = "D:\Claude\projects\streakboom-duo\app\src-tauri\target\release\streakboom.exe")
$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force $Out | Out-Null
$data = "$env:APPDATA\com.streakboom.duospike"
$pj = "$data\pet.json"
$log = @(); function Note($t) { $script:log += $t; Write-Output $t }
function Cmd($c) { Set-Content -Path "$data\duo-cmd.txt" -Value $c -Encoding ascii; Start-Sleep -Milliseconds 800 }
function LogLines { @(Get-Content "$data\duo-log.txt" -ErrorAction SilentlyContinue | ForEach-Object { $_ -replace '^\d+ ', '' }) }
function Since($m) { @(LogLines | Select-Object -Skip $m) }
function Calls($l) { @($l | Where-Object { $_ -match '^call (peak|paws)' }).Count }
function Usage { $j = Get-Content $pj -Raw -Encoding UTF8 | ConvertFrom-Json; "chat=$($j.ai.chat) day=$($j.ai.day) coolUntil=$($j.ai.coolUntil)" }
function Seed($n) { $j = Get-Content $pj -Raw -Encoding UTF8 | ConvertFrom-Json; $j.ai.day = (Get-Date -Format "yyyy-MM-dd"); $j.ai.chat = $n; $j.ai.coolUntil = 0; [System.IO.File]::WriteAllText($pj, ($j | ConvertTo-Json -Depth 30 -Compress), (New-Object System.Text.UTF8Encoding $false)) }
$script:p = $null
function Start-Pet { $env:STREAKBOOM_DUO = "1"; $env:STREAKBOOM_DUO_FAKE = "1"; $script:p = Start-Process $Exe -PassThru; Start-Sleep 8 }
function Stop-Pet { if ($script:p) { Stop-Process -Id $script:p.Id -Force -ErrorAction SilentlyContinue; Start-Sleep 2; $script:p = $null } }
function Row($name, $msg, $wait = 6) {
  $m = (LogLines).Count; Cmd "type:$msg"; Start-Sleep $wait; $l = Since $m
  Note ("{0,-44} requests={1} usage-lines=[{2}] pet.json {3}" -f $name, (Calls $l), (($l | Where-Object { $_ -match '^usage ' }) -join '; '), (Usage))
  $l | Where-Object { $_ -match '^(call |line |brain_failed|quiet:|duplicate|stale|usage |refund|charge not saved)' } | ForEach-Object { Note "     $_" }
}
if (Get-Process streakboom -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $Exe }) { throw "a streakboom.exe is already running: not touching it" }
Copy-Item $pj "$pj.bak-quota" -Force
Remove-Item "$data\duo-log.txt", "$data\duo.json" -ErrorAction SilentlyContinue
try {
  Note "exe $Exe sha256 $((Get-FileHash $Exe -Algorithm SHA256).Hash)"
  Note "== solo (Paws not called), seeded chat=10"
  Seed 10; Start-Pet
  Row "L1 solo message" "hello Peak"
  Cmd "quiet:on"; Start-Sleep 1
  Row "L2 solo message in Quiet" "still there"
  Cmd "quiet:off"; Start-Sleep 1
  Note "== group (Paws called)"
  Cmd "call"; Start-Sleep 4
  Row "L3 group message to both" "how are you both" 8
  Cmd "quiet:on"; Start-Sleep 1
  Row "L4 group message in Quiet" "both again" 6
  Cmd "quiet:off"; Start-Sleep 1
  Row "L5 canned failure (network) to Paws" "@Paws [fake:network] are you there" 6
  Stop-Pet
  Note "== at 119 with two pets eligible"
  Seed 119; Start-Pet; Cmd "call"; Start-Sleep 4
  Row "L6 message to both at 119" "both at the edge" 8
  Row "L7 next message at 120" "one more" 6
  Stop-Pet
  Note "   after a forced stop (a restart): $(Usage)"
  Start-Pet; Cmd "call"; Start-Sleep 4
  Row "L8 after the restart, same day" "after restart" 6
  Stop-Pet
  Note "== a canned rate limit, seeded chat=20"
  Seed 20; Start-Pet; Cmd "call"; Start-Sleep 4
  Row "L9 rate limit on the first pet of two" "[fake:rate_limit] both?" 8
  Row "L10 next message in the cooldown" "and now" 6
  Stop-Pet
  Note "== the write of the charge fails (pet.json of the test data made read-only, so the native rename is refused), seeded chat=30"
  Seed 30; Start-Pet; Cmd "call"; Start-Sleep 4
  Set-ItemProperty -Path $pj -Name IsReadOnly -Value $true
  Row "L11 message to both while the write fails" "both, while the disk refuses" 8
  Set-ItemProperty -Path $pj -Name IsReadOnly -Value $false
  Row "L12 the same after the write works again" "both, now it writes" 8
  Stop-Pet
} finally {
  Stop-Pet
  if (Test-Path $pj) { Set-ItemProperty -Path $pj -Name IsReadOnly -Value $false }
  Copy-Item "$pj.bak-quota" $pj -Force; Remove-Item "$pj.bak-quota" -ErrorAction SilentlyContinue
  Note "test data restored: $(Usage)"
  $log | Set-Content -Encoding utf8 "$Out\duo-quota-log.txt"
}
