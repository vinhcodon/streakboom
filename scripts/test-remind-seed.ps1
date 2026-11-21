# Moved to scripts\windows\test-remind-seed.ps1 (ADR-0132, stage 3). This stub keeps the old command working until a release has been made
# through the new path; then it is deleted.
& (Join-Path $PSScriptRoot "windows\test-remind-seed.ps1") @args
exit $LASTEXITCODE
