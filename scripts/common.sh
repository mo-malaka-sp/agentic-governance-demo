#!/usr/bin/env bash
# Shared helpers for aws-agentic-demo scripts.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CDK_DIR="$ROOT/cdk"

prompt_default() {
  local prompt="$1"
  local default="$2"
  local value
  read -r -p "$prompt [$default]: " value
  echo "${value:-$default}"
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: Required command not found: $cmd" >&2
    exit 1
  fi
}

export_aws_env() {
  export AWS_PROFILE="${AWS_PROFILE:?Set AWS_PROFILE or run via setup-and-deploy.sh}"
  export AWS_REGION="${AWS_REGION:?Set AWS_REGION or run via setup-and-deploy.sh}"
  export CDK_DEFAULT_ACCOUNT
  export CDK_DEFAULT_REGION="$AWS_REGION"
}

verify_aws_identity() {
  echo "==> Verifying AWS identity (profile=$AWS_PROFILE, region=$AWS_REGION)"
  aws sts get-caller-identity --output table
}

maybe_bootstrap_cdk() {
  local account="$1"
  local region="$2"
  echo ""
  read -r -p "Run CDK bootstrap for aws://${account}/${region}? [Y/n]: " bootstrap
  bootstrap="${bootstrap:-Y}"
  if [[ "$bootstrap" =~ ^[Yy]$ ]]; then
    (cd "$CDK_DIR" && npx cdk bootstrap "aws://${account}/${region}" --profile "$AWS_PROFILE")
  else
    echo "Skipping bootstrap (must exist already)."
  fi
}
