Write-Host "Setting up local environment for SCSC..." -ForegroundColor Cyan

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "Created .env.local from .env.example" -ForegroundColor Green
} else {
  Write-Host ".env.local already exists" -ForegroundColor Yellow
}

if (-not (Test-Path ".firebaserc")) {
  Copy-Item ".firebaserc.example" ".firebaserc"
  Write-Host "Created .firebaserc from .firebaserc.example" -ForegroundColor Green
} else {
  Write-Host ".firebaserc already exists" -ForegroundColor Yellow
}

if (-not (Test-Path ".\\node_modules\\node\\bin\\node.exe")) {
  Write-Host "Local Node runtime is missing. Run npm install first." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Fill .env.local with Firebase / SMTP values" -ForegroundColor White
Write-Host "2. Put your Firebase project ID in .firebaserc" -ForegroundColor White
Write-Host "3. Run: npm run run:local" -ForegroundColor White
