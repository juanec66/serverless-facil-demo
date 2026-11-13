param([string]$StackName = 'serverless-facil-demo')
$Query = "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue | [0]"
$Bucket = (aws cloudformation describe-stacks --stack-name $StackName --query $Query --output text).Trim()
if ($LASTEXITCODE -ne 0) { throw 'No se encontró el stack' }
if ($Bucket -and $Bucket -ne 'None') {
  aws s3 rm "s3://$Bucket" --recursive
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo vaciar el bucket' }
}
sam delete --stack-name $StackName --no-prompts
if ($LASTEXITCODE -ne 0) { throw 'Revisá el borrado del stack y recursos en CloudFormation' }
