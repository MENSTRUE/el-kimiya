param([string]$ProjectDir = 'D:\el kimiya')
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath $ProjectDir).Path
$py = Join-Path $repo 'backend\.venv\Scripts\python.exe'
if (!(Test-Path -LiteralPath $py -PathType Leaf)) { throw 'Backend venv missing. Run install-learning-v43.ps1.' }
Push-Location $repo
try {
    & $py scripts\audit-learning-v43.py
    if ($LASTEXITCODE -ne 0) { throw 'Curriculum audit failed' }
    & $py -m pytest -q backend\tests
    if ($LASTEXITCODE -ne 0) { throw 'Backend pytest failed' }
    Write-Host '[PASS] V4.3 content + API regression suite' -ForegroundColor Green
} finally { Pop-Location }
