#!/usr/bin/env bash
set -euo pipefail
STACK_NAME="${1:-serverless-facil-demo}"
BUCKET="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue | [0]" --output text)"
if [[ -n "$BUCKET" && "$BUCKET" != None ]]; then
  aws s3 rm "s3://$BUCKET" --recursive
fi
sam delete --stack-name "$STACK_NAME" --no-prompts
# Revisá que el stack haya desaparecido y los cargos se hayan detenido.
