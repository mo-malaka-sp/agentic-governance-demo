# Team guide — sharing this repo

## What this repo is

A **reference demo** for SailPoint CIEM + AWS agentic workloads:

- **Blueprint 1:** Bedrock Agent with an intentionally over-privileged IAM role
- **Blueprint 2:** AgentCore Runtime with a properly scoped execution role

It is **not production code**. Teams should treat it as a **starting template** and harden before any real workload.

---

## Production readiness checklist

| Area | Demo repo | Production expectation |
|------|-----------|------------------------|
| IAM (Blueprint 1) | `AmazonS3FullAccess` on agent role (**intentional trap**) | Least-privilege, resource-scoped policies |
| IAM (Blueprint 2) | Scoped execution role | Same, plus secrets management |
| Bedrock model | Nova Lite inference profile | Model choice per use case + guardrails |
| AgentCore bundle | Local `pip` cross-compile | CI pipeline with arm64 build, tests |
| Secrets | None | Secrets Manager / SSM |
| Monitoring | Manual verify script | CloudWatch alarms, X-Ray, budgets |
| Multi-env | Single account/region | Separate dev/stage/prod stacks |
| SailPoint | Phase 2 (manual ISC setup) | CIEM connector + campaigns documented separately |

---

## Deploy in another account/region

### Prerequisites

- AWS CLI v2 with `aws login` or credentials configured
- Node.js 20+
- Python 3 + pip3
- IAM permissions: CloudFormation, IAM, Lambda, S3, Bedrock, Bedrock Agent, Bedrock AgentCore
- Bedrock **Nova Lite** available in target region

### Steps

```bash
git clone <repo-url>
cd aws-agentic-demo
chmod +x scripts/*.sh
./scripts/setup-and-deploy.sh
```

The script prompts for:

- AWS CLI **profile name**
- **Region**
- Confirms **account ID**
- Optional **CDK bootstrap**
- Deploy confirmation

### Verify

```bash
export AWS_PROFILE=your-profile
export AWS_REGION=your-region
./scripts/verify-agents.sh
```

### Customize

Edit `cdk/cdk.json` context:

```json
{
  "foundationModel": "us.amazon.nova-lite-v1:0",
  "agentcoreModelId": "amazon.nova-lite-v1:0",
  "deployBlueprint1": true,
  "deployBlueprint2": true
}
```

Use geo inference IDs (`us.amazon.nova-lite-v1:0`) for **Bedrock Agents** with Nova models.

---

## Known Bedrock Agent caveat

After changing the agent model, the `live` alias must point to a **prepared version** that includes the new model. CDK sets `routingConfiguration` to the prepared version on deploy. If you update the model manually in console, run **Prepare** and update the alias to the latest version.

---

## Repository layout

```
aws-agentic-demo/
├── cdk/                    # AWS CDK (TypeScript)
├── cdk/agents/agentcore/     # AgentCore Python source
├── cdk/lambda/order-lookup/  # Bedrock Agent tool
├── scripts/                  # setup-and-deploy, verify, destroy, bundle
├── docs/                     # costs, deployment, team guide
└── blueprints/               # SailPoint demo scripts
```

---

## Support model

This is demo/reference infrastructure. Teams own customization, security review, and operational runbooks in their accounts.
