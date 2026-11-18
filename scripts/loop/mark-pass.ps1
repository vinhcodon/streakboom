<#
  Labels the measuring round of the pointer passes (E33, ADR-0133). Run it in a terminal tab while a test build of Peak is up.
  Each key you press writes one line `mark kind=... device=...` into loop-trace.log; every `pass` line after it belongs to that kind until the next mark.
  The pass lines themselves are written by the app; this script only writes the marks (fixed words, no meaning of anything on the screen).

    1 slow stroke over the head or belly (a rub)      4 a hard flick to shove it
    2 an ordinary move past Peak, going somewhere else   5 stop (the end of a block)
    3 a move toward Peak and then away, not a shove

  D switches the device label between mouse and trackpad. Q ends.
#>
param([string]$Device = "mouse")
$log = Join-Path $env:APPDATA "com.streakboom.app\loop-trace.log"
function Mark($kind) {
  $ms = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  Add-Content -Path $log -Value "$ms mark kind=$kind device=$Device" -Encoding utf8
  Write-Host "  -> mark kind=$kind device=$Device"
}
Write-Host "Press a key BEFORE each block of about 10 passes, then do the block with the pointer over Peak, then come back here."
Write-Host "1 slow   2 ordinary   3 toward-and-away   4 flick   5 stop   D device (now: $Device)   Q quit"
while ($true) {
  $k = [Console]::ReadKey($true).KeyChar
  switch ($k) {
    '1' { Mark "slow" }
    '2' { Mark "ordinary" }
    '3' { Mark "toward" }
    '4' { Mark "flick" }
    '5' { Mark "stop" }
    { $_ -eq 'd' -or $_ -eq 'D' } { $Device = if ($Device -eq "mouse") { "trackpad" } else { "mouse" }; Write-Host "  device = $Device" }
    { $_ -eq 'q' -or $_ -eq 'Q' } { Mark "stop"; return }
  }
}
