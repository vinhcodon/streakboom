# Looks at the SHAPE of the real pet.json and memory.json (key names and a few flags, never a value that is yours): were the
# old streak and absence fields dropped, and does the file still hold the closeness and the names? Run on the real machine
# (the agent's own PowerShell sees a private copy of AppData, ADR-0023 notes). Prints no names, no text, no key.
$dir = Join-Path $env:APPDATA "com.streakboom.app"
foreach ($n in @("pet.json", "memory.json")) {
  $f = Join-Path $dir $n
  if (-not (Test-Path $f)) { "$n : missing"; continue }
  $j = Get-Content $f -Raw | ConvertFrom-Json
  $keys = $j.PSObject.Properties.Name
  "$n : modified $((Get-Item $f).LastWriteTime)"
  "  has streak: $($keys -contains 'streak')   milestones: $($keys -contains 'milestones')   bestStreak: $($keys -contains 'bestStreak')   longestAwayDays: $($keys -contains 'longestAwayDays')"
  if ($n -eq "pet.json") { "  closeness: $(if ($null -eq $j.closeness) { "missing" } else { $j.closeness.GetType().Name })   mood: $(if ($null -eq $j.mood) { "missing" } else { $j.mood.GetType().Name })   hush present: $($keys -contains 'hush')" }
  if ($n -eq "memory.json") { "  days together (a count): $($j.days)   learn: $($j.learn)" }
}
"running: " + ((Get-Process streakboom -ErrorAction SilentlyContinue | ForEach-Object { $_.Path }) -join " | ")
