import * as cdk from 'aws-cdk-lib';

export const DEMO_PROJECT = 'aws-agentic-demo';
export const DEMO_ENV = 'demo';

export function demoTags(blueprint: '1' | '2'): Record<string, string> {
  return {
    DemoProject: DEMO_PROJECT,
    Blueprint: blueprint,
    Environment: DEMO_ENV,
  };
}

export function applyDemoTags(scope: cdk.Stack, blueprint: '1' | '2'): void {
  Object.entries(demoTags(blueprint)).forEach(([key, value]) => {
    cdk.Tags.of(scope).add(key, value);
  });
}
