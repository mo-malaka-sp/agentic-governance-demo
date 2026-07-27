#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AgentCoreStack } from '../lib/agentcore-stack';
import { BedrockAgentStack } from '../lib/bedrock-agent-stack';
import { SharedStack } from '../lib/shared-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-2',
};

const shared = new SharedStack(app, 'AwsAgenticDemo-Shared', {
  env,
  description: 'Shared resources for aws-agentic-demo (S3 RAG bucket)',
});

if (app.node.tryGetContext('deployBlueprint1') !== false) {
  new BedrockAgentStack(app, 'AwsAgenticDemo-BedrockAgent', {
    env,
    description: 'Blueprint 1: Over-privileged Bedrock Agent',
    ragBucket: shared.ragBucket,
  });
}

if (app.node.tryGetContext('deployBlueprint2') !== false) {
  new AgentCoreStack(app, 'AwsAgenticDemo-AgentCore', {
    env,
    description: 'Blueprint 2: AgentCore Runtime (direct code deploy)',
  });
}

app.synth();
