param(
  [string]$ProjectDir = 'D:\el kimiya',
  [string]$Downloads = (Join-Path $env:USERPROFILE 'Downloads')
)
$ErrorActionPreference='Stop'
$project = (Resolve-Path -LiteralPath $ProjectDir).Path
$destination=Join-Path $project 'private\chemistry-books'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
if(!(Test-Path -LiteralPath $Downloads -PathType Container)){throw "Downloads folder missing: $Downloads"}
$sourceFiles=@(Get-ChildItem -LiteralPath $Downloads -File -Filter '*.pdf')
$spec=@(
  @{id='kuncoro-2021'; regex='dasar[ _-]*dasar[ _-]*kimia[ _-]*islam'},
  @{id='kimia-dasar'; regex='^buku[ _-]*kimia[ _-]*dasar'},
  @{id='yahdi-2020'; regex='eksperimen[ _-]*kimia'},
  @{id='cucu-2022'; regex='integrasi.*sains.*cucu|integrasi.*sains.*islam'},
  @{id='uii-2017'; regex='refleksi.*nilai.*(kimia|islam)'},
  @{id='kemenag-2013'; regex='makanan[ _-]*minuman'},
  @{id='kusuma-2020'; regex='buku[ _-]*kajian[ _-]*sains'},
  @{id='water-2024'; regex='kimia[ _-]*air[ _-]*dalam[ _-]*cairan'}
)
$found=0
foreach($book in $spec){
  $candidates=@($sourceFiles | Where-Object {$_.Name -match $book.regex} | Sort-Object @{Expression={if($_.BaseName -match '\(\d+\)'){1}else{0}}}, @{Expression={$_.Name.Length}})
  if(!$candidates.Count){
    Write-Host "[MISSING] $($book.id): not found in Downloads" -ForegroundColor Yellow
    continue
  }
  $first=$candidates[0]
  $target=Join-Path $destination ($book.id+'__'+$first.Name)
  if(Test-Path -LiteralPath $target){
    $sourceHash=(Get-FileHash -LiteralPath $first.FullName -Algorithm SHA256).Hash
    $destHash=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    if($sourceHash -eq $destHash){
      Write-Host "[EXISTS] $($book.id)" -ForegroundColor DarkGreen
      $found++
      continue
    }
  }
  Copy-Item -LiteralPath $first.FullName -Destination $target -Force
  $found++
  Write-Host "[COPIED] $($book.id) -> $($first.Name)" -ForegroundColor Green
}
Write-Host "`nCompleted: $found / 8 book PDFs in $destination" -ForegroundColor Cyan
Write-Host 'IMPORTANT: private/ is gitignored; do not upload textbook PDFs to GitHub or public Hosting.' -ForegroundColor Yellow
Write-Host 'NEXT: My Library > Choose local PDF folder > select private\chemistry-books.' -ForegroundColor Cyan
