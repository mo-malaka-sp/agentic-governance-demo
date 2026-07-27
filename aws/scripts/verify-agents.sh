#!/usr/bin/env bash
set -euo pipefail

PROFILE="${AWS_PROFILE:-}"
REGION="${AWS_REGION:-}"

if [[ -z "$PROFILE" ]]; then
  # shellcheck source=common.sh
  source "$(dirname "$0")/common.sh"
  PROFILE="$(prompt_default "AWS CLI profile" "agentic-demo")"
fi
if [[ -z "$REGION" ]]; then
  REGION="$(prompt_default "AWS region" "us-east-2")"
fi

export AWS_PROFILE="$PROFILE"
export AWS_REGION="$REGION"

echo "==> Verifying AWS identity"
aws sts get-caller-identity

echo ""
echo "==> CloudFormation stack status"
for stack in AwsAgenticDemo-Shared AwsAgenticDemo-BedrockAgent AwsAgenticDemo-AgentCore; do
  status=$(aws cloudformation describe-stacks \
    --stack-name "$stack" \
    --query 'Stacks[0].StackStatus' \
    --output text)
  echo "  $stack: $status"
done

get_output() {
  local stack=$1
  local key=$2
  aws cloudformation describe-stacks \
    --stack-name "$stack" \
    --query "Stacks[0].Outputs[?OutputKey=='${key}'].OutputValue" \
    --output text 2>/dev/null || echo ""
}

AGENT_ID=$(get_output "AwsAgenticDemo-BedrockAgent" "AgentId")
ALIAS_ID=$(get_output "AwsAgenticDemo-BedrockAgent" "AgentAliasId")
RUNTIME_ARN=$(get_output "AwsAgenticDemo-AgentCore" "AgentRuntimeArn")
RUNTIME_ID=$(get_output "AwsAgenticDemo-AgentCore" "AgentRuntimeId")

echo ""
echo "==> Bedrock Agent (CustomerServiceAgent)"
if [[ -n "$AGENT_ID" ]]; then
  aws bedrock-agent get-agent --agent-id "$AGENT_ID" \
    --query '{name:agentName,status:agentStatus,model:foundationModel}' \
    --output table 2>/dev/null || echo "  (get-agent requires recent AWS CLI; check console instead)"
  echo "  AgentId: $AGENT_ID"
  echo "  AliasId (live): $ALIAS_ID"
else
  echo "  ERROR: Agent outputs missing"
fi

echo ""
echo "==> AgentCore Runtime (SupportAgent)"
if [[ -n "$RUNTIME_ID" ]]; then
  aws bedrock-agentcore-control get-agent-runtime --agent-runtime-id "$RUNTIME_ID" \
    --query '{name:agentRuntimeName,status:status,arn:agentRuntimeArn}' \
    --output table 2>/dev/null || echo "  (get-agent-runtime requires recent AWS CLI; check console instead)"
  echo "  RuntimeArn: $RUNTIME_ARN"
else
  echo "  ERROR: AgentCore outputs missing"
fi

echo ""
echo "==> IAM trap check: Bedrock_CustomerService_Agent_Role"
aws iam list-attached-role-policies \
  --role-name Bedrock_CustomerService_Agent_Role \
  --query 'AttachedPolicies[].PolicyName' \
  --output table

echo ""
echo "==> Optional: invoke Bedrock Agent (requires AWS CLI with bedrock-agent-runtime)"
if aws bedrock-agent-runtime help 2>/dev/null | grep -q invoke-agent; then
  SESSION_ID="verify-$(date +%s)"
  aws bedrock-agent-runtime invoke-agent \
    --agent-id "$AGENT_ID" \
    --agent-alias-id "$ALIAS_ID" \
    --session-id "$SESSION_ID" \
    --input-text "What is the status of order 1001?" \
    /tmp/bedrock-agent-out.json
  echo "Bedrock response written to /tmp/bedrock-agent-out.json"
  cat /tmp/bedrock-agent-out.json
else
  echo "  Skip: 'aws bedrock-agent-runtime invoke-agent' not available — update AWS CLI or test in Bedrock console."
  echo "  Console: Bedrock → Agents → CustomerServiceAgent → live alias → Test"
fi

echo ""
echo "==> Optional: invoke AgentCore Runtime"
if aws bedrock-agentcore help 2>/dev/null | grep -q invoke-agent-runtime; then
  aws bedrock-agentcore invoke-agent-runtime \
    --agent-runtime-arn "$RUNTIME_ARN" \
    --qualifier DEFAULT \
    --payload '{"prompt":"Hello, who are you?"}' \
    /tmp/agentcore-out.json
  echo "AgentCore response written to /tmp/agentcore-out.json"
  cat /tmp/agentcore-out.json
else
  echo "  Skip: 'aws bedrock-agentcore invoke-agent-runtime' not available — update AWS CLI or test in console."
  echo "  Console: Bedrock → AgentCore → Runtimes → SupportAgent → Test"
fi

echo ""
echo "Verification complete."
