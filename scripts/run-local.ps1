if (-not (Test-Path ".\\node_modules\\node\\bin\\node.exe")) {
  Write-Host "Local Node runtime is missing. Run npm install first." -ForegroundColor Red
  exit 1
}

Write-Host "Starting SCSC with project-local Node..." -ForegroundColor Cyan
Write-Host "Using isolated Next build directory: .next-dev" -ForegroundColor DarkCyan
$env:NEXT_DIST_DIR = ".next-dev"
& ".\\node_modules\\node\\bin\\node.exe" ".\\node_modules\\next\\dist\\bin\\next" "dev"
