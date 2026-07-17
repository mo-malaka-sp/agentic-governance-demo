#!/usr/bin/env bash
# Interactive deploy for aws-agentic-demo (Bedrock Agent + AgentCore).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

echo "=============================================="
echo " AWS Agentic Demo — Setup & Deploy"
echo "=============================================="
echo ""
echo "This deploys DEMO infrastructure (not production-ready)."
echo "Blueprint 1 intentionally creates an over-privileged IAM role for CIEM demos."
echo ""

require_command aws
require_command npm
require_command npx
require_command pip3

AWS_PROFILE="$(prompt_default "AWS CLI profile name" "${AWS_PROFILE:-agentic-demo}")"
AWS_REGION="$(prompt_default "AWS region (Bedrock must be available)" "${AWS_REGION:-us-east-2}")"

export AWS_PROFILE
export AWS_REGION

echo ""
verify_aws_identity

CDK_DEFAULT_ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
export CDK_DEFAULT_ACCOUNT
export CDK_DEFAULT_REGION="$AWS_REGION"

read -r -p "Deploy to account ${CDK_DEFAULT_ACCOUNT} in ${AWS_REGION}? [Y/n]: " confirm
confirm="${confirm:-Y}"
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

maybe_bootstrap_cdk "$CDK_DEFAULT_ACCOUNT" "$AWS_REGION"

echo ""
echo "==> Installing CDK dependencies"
(cd "$CDK_DIR" && npm install)

echo "==> Building TypeScript"
(cd "$CDK_DIR" && npm run build)

echo "==> Bundling AgentCore Python dependencies (linux/arm64)"
"$SCRIPT_DIR/bundle-agentcore.sh"

echo ""
read -r -p "Deploy all stacks now? [Y/n]: " deploy_now
deploy_now="${deploy_now:-Y}"
if [[ ! "$deploy_now" =~ ^[Yy]$ ]]; then
  echo "Build complete. Deploy later with: ./scripts/deploy.sh"
  exit 0
fi

(cd "$CDK_DIR" && npx cdk deploy --all --require-approval never --profile "$AWS_PROFILE")

echo ""
echo "=============================================="
echo " Deploy complete"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Verify:  AWS_PROFILE=$AWS_PROFILE AWS_REGION=$AWS_REGION ./scripts/verify-agents.sh"
echo "  2. Costs:    see docs/COSTS.md"
echo "  3. Teardown: AWS_PROFILE=$AWS_PROFILE ./scripts/destroy.sh"
echo ""
