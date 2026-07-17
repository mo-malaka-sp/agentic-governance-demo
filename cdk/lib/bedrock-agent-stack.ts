import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { applyDemoTags } from './demo-tags';

export interface BedrockAgentStackProps extends cdk.StackProps {
  ragBucket: s3.IBucket;
}

export class BedrockAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BedrockAgentStackProps) {
    super(scope, id, props);

    applyDemoTags(this, '1');

    const foundationModel =
      (this.node.tryGetContext('foundationModel') as string) ??
      'us.amazon.nova-lite-v1:0';

    // Intentionally over-privileged execution role (Blueprint 1 CIEM trap).
    const agentRole = new iam.Role(this, 'BedrockCustomerServiceAgentRole', {
      roleName: 'Bedrock_CustomerService_Agent_Role',
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('bedrock.amazonaws.com'),
        new iam.ServicePrincipal('lambda.amazonaws.com'),
      ),
      description: 'Demo: intentionally over-privileged Bedrock agent execution role',
    });

    agentRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
    );
    agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['*'],
      }),
    );

    agentRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'BedrockInvokeNovaLite',
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
          'bedrock:GetInferenceProfile',
          'bedrock:ListInferenceProfiles',
          'bedrock:UseInferenceProfile',
        ],
        resources: [
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/us.amazon.nova-lite-v1:0`,
          'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0',
          'arn:aws:bedrock:us-east-2::foundation-model/amazon.nova-lite-v1:0',
          'arn:aws:bedrock:us-west-2::foundation-model/amazon.nova-lite-v1:0',
        ],
      }),
    );

    const orderLookupFn = new lambda.Function(this, 'OrderLookupFunction', {
      functionName: 'aws-agentic-demo-order-lookup',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/order-lookup')),
      role: agentRole,
      timeout: cdk.Duration.seconds(30),
      description: 'Stub order lookup tool for CustomerServiceAgent',
    });

    const agent = new bedrock.CfnAgent(this, 'CustomerServiceAgent', {
      agentName: 'CustomerServiceAgent',
      description: 'Demo customer service agent — Blueprint 1 over-privileged role',
      agentResourceRoleArn: agentRole.roleArn,
      foundationModel,
      instruction: [
        'You are a customer service agent for a demo e-commerce store.',
        'Help customers with order status questions.',
        'When asked about an order, use the get_order_status tool with the order ID.',
        'Known order IDs: 1001 (Widget Pro), 1002 (Gadget X).',
        'Be concise and friendly.',
      ].join(' '),
      autoPrepare: true,
      idleSessionTtlInSeconds: 600,
      actionGroups: [
        {
          actionGroupName: 'OrderLookupActionGroup',
          actionGroupState: 'ENABLED',
          description: 'Look up order status by order ID',
          actionGroupExecutor: {
            lambda: orderLookupFn.functionArn,
          },
          functionSchema: {
            functions: [
              {
                name: 'get_order_status',
                description: 'Returns the status and item name for a customer order',
                parameters: {
                  order_id: {
                    type: 'string',
                    description: 'The order ID to look up, e.g. 1001',
                    required: true,
                  },
                },
                requireConfirmation: 'DISABLED',
              },
            ],
          },
        },
      ],
    });

    orderLookupFn.addPermission('AllowBedrockInvoke', {
      principal: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: agent.attrAgentArn,
    });

    const alias = new bedrock.CfnAgentAlias(this, 'LiveAlias', {
      agentId: agent.attrAgentId,
      agentAliasName: 'live',
      description: 'Live alias for demo and verification',
      routingConfiguration: [
        {
          agentVersion: agent.attrAgentVersion,
        },
      ],
    });
    alias.addDependency(agent);

    new cdk.CfnOutput(this, 'AgentId', {
      value: agent.attrAgentId,
      description: 'Bedrock Agent ID',
    });

    new cdk.CfnOutput(this, 'AgentAliasId', {
      value: alias.attrAgentAliasId,
      description: 'Bedrock Agent live alias ID',
    });

    new cdk.CfnOutput(this, 'AgentArn', {
      value: agent.attrAgentArn,
      description: 'Bedrock Agent ARN',
    });

    new cdk.CfnOutput(this, 'AgentRoleArn', {
      value: agentRole.roleArn,
      description: 'Over-privileged execution role ARN (CIEM demo target)',
    });

    new cdk.CfnOutput(this, 'InvokeAgentCommand', {
      value: [
        `aws bedrock-agent-runtime invoke-agent --region ${this.region}`,
        `--agent-id ${agent.attrAgentId} --agent-alias-id ${alias.attrAgentAliasId}`,
        '--session-id "demo-session" --input-text "What is the status of order 1001?" /tmp/bedrock-out.json',
      ].join(' '),
      description: 'CLI command to verify the Bedrock Agent (set AWS_PROFILE first)',
    });
  }
}
