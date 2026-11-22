param(
    [switch]$Full,
    [switch]$Smoke,
    [string]$HostedUrl = "",
    [switch]$NoStart
)
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
Set-Location $project

function Test-Http([string]$Url) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 4
        return ($response.StatusCode -eq 200)
    } catch { return $false }
}
function Await-Http([string]$Url, [int]$Seconds) {
    $end = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $end) {
        if (Test-Http $Url) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}
function Run-Checked([string]$Name, [string]$Exe, [string[]]$Parameters) {
    Write-Host "`n[$Name]" -ForegroundColor Cyan
    & $Exe @Parameters
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" }
}

Write-Host "`nEL-KIMIYA V4.8 AUTOMATED QA" -ForegroundColor Cyan
Write-Host "Project: $project"
if ($Full) {
    Write-Host 'FULL MODE: Real Firebase AI requests (cloud may use quota).' -ForegroundColor Yellow
} else {
    Write-Host 'SMOKE MODE: No real AI model calls.' -ForegroundColor Yellow
}

$backendUrl = 'http://127.0.0.1:8000/api/v1/learning/health'
$webUrl = 'http://127.0.0.1:8443/'

if (-not (Test-Http $backendUrl)) {
    if ($NoStart) { throw "Backend not running at $backendUrl" }
    $startBackend = Join-Path $project 'scripts\start-backend-learning-v43.ps1'
    if (-not (Test-Path $startBackend)) { throw 'Backend startup script V4.3 missing.' }
    if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) {
        throw 'Port 8000 already in use, but V4.3 health check failed. Stop the conflicting server.'
    }
    Write-Host '[START] FastAPI V4.3' -ForegroundColor Yellow
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $project -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-NoExit', '-File', "`"$startBackend`""
    ) | Out-Null
    if (-not (Await-Http $backendUrl 45)) { throw 'FastAPI startup timeout, see backend terminal.' }
}
Write-Host '[PASS] Backend online' -ForegroundColor Green

if (-not (Test-Http $webUrl)) {
    if ($NoStart) { throw "Frontend not running at $webUrl" }
    if (Get-NetTCPConnection -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue) {
        throw 'Port 8443 occupied but frontend HTTP request failed.'
    }
    Write-Host '[START] React / Vite 8443' -ForegroundColor Yellow
    Start-Process -FilePath 'cmd.exe' -WorkingDirectory $project -ArgumentList '/k', 'npm run dev' | Out-Null
    if (-not (Await-Http $webUrl 45)) { throw 'Frontend startup timeout, see Vite terminal.' }
}
Write-Host '[PASS] Frontend online' -ForegroundColor Green

Run-Checked 'TypeScript' 'npm.cmd' @('run','typecheck')
Run-Checked 'Production Build' 'npm.cmd' @('run','build')
Run-Checked 'V4.7 source and live data gate' 'node.exe' @('scripts/v47-web-gate.mjs','--strict','--live')

if (-not (Test-Path 'node_modules/playwright/package.json')) {
    Write-Host '[INSTALL] Playwright dev dependency (first run only)' -ForegroundColor Yellow
    Run-Checked 'Install Playwright' 'npm.cmd' @('install','--save-dev','playwright')
}

$argsForTest = @('scripts/hybrid-e2e-v48.mjs')
if ($Full) { $argsForTest += '--full' } else { $argsForTest += '--smoke' }
if ($HostedUrl) { $argsForTest += "--hosted=$HostedUrl" }
Run-Checked 'Chrome and Firebase E2E' 'node.exe' $argsForTest
Write-Host "`n[DONE] QA runner finished; check PASS/FAIL/WARN/REVIEW/SKIP in private\qa-v48-reports." -ForegroundColor Cyan
