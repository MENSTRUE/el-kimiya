param([string]$ProjectDir = 'D:\el kimiya')
$ErrorActionPreference='Stop'
$repo=(Resolve-Path -LiteralPath $ProjectDir).Path
$py=Join-Path $repo 'backend\.venv\Scripts\python.exe'
Push-Location $repo
try {
  & node 'scripts\check-v42.mjs'
  if($LASTEXITCODE -ne 0){throw 'Static check failed.'}
  if(!(Test-Path -LiteralPath $py)){throw 'Backend Python venv not found.'}
  & $py -m pytest -q backend\tests
  if($LASTEXITCODE -ne 0){throw 'Backend tests failed.'}
  & npm.cmd run verify
  if($LASTEXITCODE -ne 0){throw 'Frontend tests/build failed.'}
  Write-Host '[PASS] EL-KIMIYA V4.2 VERIFIED' -ForegroundColor Green
} finally {Pop-Location}
