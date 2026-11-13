#!/usr/bin/env bash
# Requiere Bash, AWS CLI configurado y Node.js con npm.
set -euo pipefail
STACK_NAME="${1:-serverless-facil-demo}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

output() {
  aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue | [0]" --output text
}
BUCKET="$(output FrontendBucketName)"
DISTRIBUTION="$(output CloudFrontDistributionId)"
URL="$(output AppUrl)"
if [[ "$BUCKET" == "None" || -z "$BUCKET" ]]; then
  echo "No encontré el stack '$STACK_NAME'. Primero ejecutá sam build && sam deploy --guided." >&2; exit 1
fi

cd "$ROOT/frontend"
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build
if [[ ! -d dist ]]; then echo 'No existe dist' >&2; exit 1; fi
aws s3 sync dist/ "s3://$BUCKET/" --delete
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" --paths '/*' >/dev/null
printf '\nListo. Abrí: %s\n' "$URL"
