param([string]$ProjectDir = 'D:\el kimiya')
$ErrorActionPreference='Stop'
$repo=(Resolve-Path -LiteralPath $ProjectDir).Path
$python=Join-Path $repo 'backend\.venv\Scripts\python.exe'
if(!(Test-Path -LiteralPath $python)){throw 'Backend venv not found. Run install-v42.ps1 first.'}
Push-Location $repo
try {
  Write-Host '[RUNNING] FastAPI molecular backend at http://127.0.0.1:8000/docs' -ForegroundColor Cyan
  & $python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
  if($LASTEXITCODE -ne 0){throw 'Backend process stopped with an error.'}
} finally { Pop-Location }
