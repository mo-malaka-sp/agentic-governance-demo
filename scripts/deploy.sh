#!/usr/bin/env bash
# Non-interactive redeploy (set AWS_PROFILE and AWS_REGION first).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

AWS_PROFILE="${AWS_PROFILE:-$(prompt_default "AWS CLI profile" "agentic-demo")}"
AWS_REGION="${AWS_REGION:-$(prompt_default "AWS region" "us-east-2")}"

export AWS_PROFILE
export AWS_REGION
export CDK_DEFAULT_ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
export CDK_DEFAULT_REGION="$AWS_REGION"

echo "==> Deploying (profile=$AWS_PROFILE, region=$AWS_REGION, account=$CDK_DEFAULT_ACCOUNT)"

(cd "$CDK_DIR" && npm install && npm run build)
"$SCRIPT_DIR/bundle-agentcore.sh"
(cd "$CDK_DIR" && npx cdk deploy --all --require-approval never --profile "$AWS_PROFILE")

echo "==> Done. Run ./scripts/verify-agents.sh"
