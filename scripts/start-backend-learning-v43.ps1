param([string]$ProjectDir = 'D:\el kimiya')
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repo = (Resolve-Path -LiteralPath $ProjectDir).Path
$python = Join-Path $repo 'backend\.venv\Scripts\python.exe'
if (!(Test-Path -LiteralPath $python -PathType Leaf)) { throw 'Backend virtual environment missing; install V4.3 first.' }
$listener = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    try {
        $existing = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/learning/health' -TimeoutSec 4
        if ($existing.status -eq 'ok') {
            Write-Host '[PASS] Backend already running with V4.3 learning API at http://127.0.0.1:8000/docs' -ForegroundColor Green
            return
        }
    } catch { }
    throw 'Port 8000 is occupied by another/older server. Stop that backend in its own terminal, then retry.'
}
Push-Location $repo
try {
    Write-Host '[START] FastAPI + ChEMBL molecular API + 13-topic learning API at 127.0.0.1:8000' -ForegroundColor Cyan
    Write-Host 'Docs: http://127.0.0.1:8000/docs'
    Write-Host 'Content: http://127.0.0.1:8000/api/v1/learning/health'
    & $python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
    if ($LASTEXITCODE -ne 0) { throw 'FastAPI exited with an error.' }
} finally { Pop-Location }
