import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as agentcore from 'aws-cdk-lib/aws-bedrockagentcore';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { applyDemoTags } from './demo-tags';

export class AgentCoreStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    applyDemoTags(this, '2');

    const modelId =
      (this.node.tryGetContext('agentcoreModelId') as string) ?? 'amazon.nova-lite-v1:0';

    const executionRole = new iam.Role(this, 'AgentCoreExecutionRole', {
      roleName: 'AgentCore_SupportAgent_Execution_Role',
      assumedBy: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com'),
      description: 'Properly scoped AgentCore runtime execution role (Blueprint 2)',
    });

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'BedrockModelInvoke',
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/*`,
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
        ],
      }),
    );

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudWatchLogs',
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: ['*'],
      }),
    );

    const agentRuntimeArtifact = agentcore.AgentRuntimeArtifact.fromCodeAsset({
      path: path.join(__dirname, '../agents/agentcore-bundle'),
      runtime: agentcore.AgentCoreRuntime.PYTHON_3_12,
      entrypoint: ['main.py'],
    });

    const runtime = new agentcore.Runtime(this, 'SupportAgentRuntime', {
      runtimeName: 'SupportAgent',
      description: 'Demo AgentCore support agent — Blueprint 2 human access paths',
      agentRuntimeArtifact,
      executionRole,
      environmentVariables: {
        AGENTCORE_MODEL_ID: modelId,
      },
    });

    new cdk.CfnOutput(this, 'AgentRuntimeId', {
      value: runtime.agentRuntimeId,
      description: 'AgentCore Runtime ID',
    });

    new cdk.CfnOutput(this, 'AgentRuntimeArn', {
      value: runtime.agentRuntimeArn,
      description: 'AgentCore Runtime ARN',
    });

    new cdk.CfnOutput(this, 'AgentCoreExecutionRoleArn', {
      value: executionRole.roleArn,
      description: 'Scoped AgentCore execution role ARN',
    });

    new cdk.CfnOutput(this, 'InvokeAgentCoreCommand', {
      value: [
        `aws bedrock-agentcore invoke-agent-runtime --region ${this.region}`,
        `--agent-runtime-arn ${runtime.agentRuntimeArn} --qualifier DEFAULT`,
        `--payload '{"prompt":"Hello, who are you?"}' /tmp/agentcore-out.json`,
      ].join(' '),
      description: 'CLI command to verify the AgentCore Runtime (set AWS_PROFILE first)',
    });
  }
}
