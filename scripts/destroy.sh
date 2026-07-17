#!/usr/bin/env bash
# Tear down all aws-agentic-demo CloudFormation stacks.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

AWS_PROFILE="$(prompt_default "AWS CLI profile name" "${AWS_PROFILE:-agentic-demo}")"
AWS_REGION="$(prompt_default "AWS region" "${AWS_REGION:-us-east-2}")"

export AWS_PROFILE
export AWS_REGION

echo ""
verify_aws_identity

echo ""
echo "WARNING: This destroys all demo stacks and most resources."
echo "  - AwsAgenticDemo-Shared (S3 bucket — contents deleted)"
echo "  - AwsAgenticDemo-BedrockAgent"
echo "  - AwsAgenticDemo-AgentCore"
echo ""
read -r -p "Type 'destroy' to confirm: " confirm
if [[ "$confirm" != "destroy" ]]; then
  echo "Aborted."
  exit 0
fi

(cd "$CDK_DIR" && npx cdk destroy --all --force --profile "$AWS_PROFILE")

echo ""
echo "Destroy complete. Bedrock model usage charges stop when agents are not invoked."
echo "Verify no stacks remain: aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE --profile $AWS_PROFILE"
