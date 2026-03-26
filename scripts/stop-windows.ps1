$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host "Stopping PreLegal..."
docker compose down
Write-Host "PreLegal stopped."
