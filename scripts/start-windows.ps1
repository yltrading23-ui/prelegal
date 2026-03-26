$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host "Building and starting PreLegal..."
docker compose up --build -d
Write-Host "PreLegal is running at http://localhost:8000"
