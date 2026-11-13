param([string]$StackName = "serverless-facil-demo")
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
function Get-Output([string]$Key) {
  $query = "Stacks[0].Outputs[?OutputKey=='$Key'].OutputValue | [0]"
  $result = aws cloudformation describe-stacks --stack-name $StackName --query $query --output text
  if ($LASTEXITCODE -ne 0 -or !$result -or $result -eq 'None') { throw "No se encuentra $Key en $StackName" }
  return $result.Trim()
}
$Bucket = Get-Output 'FrontendBucketName'
$Distribution = Get-Output 'CloudFrontDistributionId'
$Url = Get-Output 'AppUrl'
Push-Location "$Root/frontend"
try {
  if (Test-Path 'package-lock.json') { npm ci } else { npm install }
  if ($LASTEXITCODE -ne 0) { throw 'Falló npm install/ci' }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Falló el build React/Vite' }
  if (!(Test-Path 'dist')) { throw 'No existe dist' }
  aws s3 sync 'dist/' "s3://$Bucket/" --delete
  if ($LASTEXITCODE -ne 0) { throw 'Falló aws s3 sync' }
  aws cloudfront create-invalidation --distribution-id $Distribution --paths '/*'
  if ($LASTEXITCODE -ne 0) { throw 'Falló la invalidación' }
  Write-Host "Aplicación: $Url"
} finally { Pop-Location }
