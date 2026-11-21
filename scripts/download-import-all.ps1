param([string]$ProjectDir='D:\el kimiya', [switch]$DownloadOnly)
$ErrorActionPreference='Stop'
Set-Location -LiteralPath $ProjectDir
$folder=Join-Path $ProjectDir 'private\compound_data'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
$source='https://ftp.ebi.ac.uk/pub/databases/chembl/ChEMBLdb/releases/chembl_37/chembl_37_chemreps.txt.gz'
$gzip=Join-Path $folder 'chembl_37_chemreps.txt.gz'
$db=Join-Path $folder 'chembl_37.sqlite'
$script=Join-Path $ProjectDir 'scripts\import_chembl_bulk.py'
if(-not (Test-Path $script)){throw 'Importer missing. Please install patch files first.'}
$curl = Get-Command 'curl.exe' -ErrorAction SilentlyContinue
if(-not $curl){throw 'curl.exe is required. Windows 11 normally includes it.'}
if(!(Test-Path $gzip) -or (Get-Item $gzip).Length -lt 290000000){
    Write-Host '[DOWNLOAD] Official ChEMBL 37 bulk file (~293 MB). Resumable.' -ForegroundColor Cyan
    & curl.exe --fail --location --retry 4 --retry-delay 4 --continue-at - --output $gzip $source
    if($LASTEXITCODE -ne 0){throw 'Download failed. Retry the script to resume.'}
}
if((Get-Item $gzip).Length -lt 290000000){throw 'Download appears incomplete. Re-run to resume.'}
if($DownloadOnly){Write-Host '[DONE] Download only'; exit 0}
Write-Host '[IMPORT] Building private SQLite database. This includes all molecules with SMILES.' -ForegroundColor Cyan
& py -3 $script --input $gzip --db $db --limit 0
if($LASTEXITCODE -ne 0){throw 'Import failed. Existing final SQLite database not overwritten.'}
Write-Host '[PASS] Bulk ChEMBL source imported. No website code changed.' -ForegroundColor Green
