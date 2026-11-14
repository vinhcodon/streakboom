<#
  A test aid for the remind skill (ADR-0115): put kept days into memory.json, and/or zero today's chat count in pet.json, so the
  delivery and the Settings list can be seen without the chat model (and without waiting for the daily chat limit to reset).

  Close Peak first (tray menu, Quit): the pet window is the only writer of these files and would overwrite the change. The script
  refuses to run while Peak is running, and keeps a copy of each file it changes (name.json.bak).

    .\scripts\test-remind-seed.ps1 -Today              # a day for today (Peak cheers within a minute of starting) and one that
                                                       # came by 2 days ago (said once, as a late cheer)
    .\scripts\test-remind-seed.ps1 -ResetChat          # today's chat count back to 0, so the chat answers again
    .\scripts\test-remind-seed.ps1 -Clear              # remove the days this script added (ids starting with "seed-")
    .\scripts\test-remind-seed.ps1 -Today -Folder C:\somewhere   # another data folder (default: %APPDATA%\com.streakboom.app)

  It never reads or writes a key, and it changes nothing but those fields.
#>
param(
  [switch]$Today,
  [switch]$ResetChat,
  [switch]$Clear,
  [string]$Folder = ""
)
$ErrorActionPreference = "Stop"
if (-not ($Today -or $ResetChat -or $Clear)) { throw "Say what to do: -Today, -ResetChat or -Clear (see the top of this file)." }
# the real data folder is only touched while Peak is not running; a folder named with -Folder is taken for a copy
if (-not $Folder) {
  $Folder = Join-Path $env:APPDATA "com.streakboom.app"
  if (Get-Process -Name "streakboom*" -ErrorAction SilentlyContinue) { throw "Peak is running. Quit it from the tray menu first, then run this again." }
}
if (-not (Test-Path $Folder)) { throw "No data folder at $Folder" }

function Read-Json($path) { if (Test-Path $path) { return (Get-Content -Raw -Encoding UTF8 $path | ConvertFrom-Json) } else { return $null } }
function Write-Json($path, $obj) {
  if (Test-Path $path) { Copy-Item $path "$path.bak" -Force }
  $text = $obj | ConvertTo-Json -Depth 20
  [IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding($false)))
}

if ($Today -or $Clear) {
  $memPath = Join-Path $Folder "memory.json"
  $mem = Read-Json $memPath
  if ($null -eq $mem) { throw "No memory.json in $Folder (start Peak once, quit it, then run this)." }
  $kept = @()
  if ($mem.PSObject.Properties.Name -contains "keptDays" -and $mem.keptDays) { $kept = @($mem.keptDays | Where-Object { $_.id -notlike "seed-*" }) }
  if ($Today) {
    $now = Get-Date
    $ms = [int64]([DateTimeOffset]$now).ToUnixTimeMilliseconds()
    $kept += [pscustomobject]@{ id = "seed-today"; md = $now.ToString("MM-dd"); year = 0; label = "ngay thu nghiem"; t = $ms; done = "" }
    $kept += [pscustomobject]@{ id = "seed-late"; md = $now.AddDays(-2).ToString("MM-dd"); year = 0; label = "ngay den som"; t = $ms; done = "" }
    $check = $now.AddDays(-4).ToString("yyyy-MM-dd")
    if ($mem.PSObject.Properties.Name -contains "keptCheck") { $mem.keptCheck = $check } else { $mem | Add-Member -NotePropertyName keptCheck -NotePropertyValue $check }
  }
  if ($mem.PSObject.Properties.Name -contains "keptDays") { $mem.keptDays = $kept } else { $mem | Add-Member -NotePropertyName keptDays -NotePropertyValue $kept }
  Write-Json $memPath $mem
  Write-Host "memory.json: $($kept.Count) kept day(s) now."
}

if ($ResetChat) {
  $petPath = Join-Path $Folder "pet.json"
  $pet = Read-Json $petPath
  if ($null -eq $pet) { throw "No pet.json in $Folder" }
  if ($pet.PSObject.Properties.Name -contains "ai" -and $pet.ai) {
    $pet.ai.chat = 0
    $pet.ai.coolUntil = 0
    Write-Json $petPath $pet
    Write-Host "pet.json: today's chat count is 0 (the daily limit is 60)."
  } else { Write-Host "pet.json has no chat count yet: nothing to reset." }
}
