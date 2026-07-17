import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { applyDemoTags } from './demo-tags';

export class SharedStack extends cdk.Stack {
  public readonly ragBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    applyDemoTags(this, '1');

    this.ragBucket = new s3.Bucket(this, 'RagBucket', {
      bucketName: `aws-agentic-demo-rag-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, 'SampleDocs', {
      sources: [
        s3deploy.Source.data(
          'customer-service-faq.txt',
          [
            'Customer Service FAQ',
            '',
            'Order 1001: Widget Pro — status shipped.',
            'Order 1002: Gadget X — status processing.',
            'Returns are accepted within 30 days of delivery.',
          ].join('\n'),
        ),
      ],
      destinationBucket: this.ragBucket,
    });

    new cdk.CfnOutput(this, 'RagBucketName', {
      value: this.ragBucket.bucketName,
      description: 'S3 bucket for RAG documents (Bedrock Agent KB — Phase 2)',
    });
  }
}
