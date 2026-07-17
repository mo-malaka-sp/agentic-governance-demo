# AWS Agentic Demo

Reference infrastructure for **SailPoint CIEM** demos with two AWS agent patterns:

| Blueprint | AWS service | CIEM story |
|-----------|-------------|------------|
| **1** | Amazon Bedrock Agent | Over-privileged **machine identity** (`AmazonS3FullAccess` on agent role) |
| **2** | Amazon Bedrock AgentCore | Properly scoped runtime + future **human-to-agent** access paths |

> **Not production code.** Blueprint 1 is intentionally insecure for governance demos. See [docs/TEAM-GUIDE.md](docs/TEAM-GUIDE.md).

---

## Quick start (new team / new account)

```bash
chmod +x scripts/*.sh
./scripts/setup-and-deploy.sh
```

Prompts for AWS profile, region, account confirmation, optional CDK bootstrap, and deploy.

```bash
export AWS_PROFILE=your-profile
export AWS_REGION=us-east-2
./scripts/verify-agents.sh
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/setup-and-deploy.sh` | **Interactive** first-time setup + deploy (recommended) |
| `scripts/deploy.sh` | Redeploy (uses `AWS_PROFILE` / `AWS_REGION` env vars) |
| `scripts/verify-agents.sh` | Health check + optional CLI invoke |
| `scripts/destroy.sh` | Tear down all stacks (type `destroy` to confirm) |
| `scripts/bundle-agentcore.sh` | Bundle AgentCore Python deps (called by deploy) |

Copy [.env.example](.env.example) to `.env` for local defaults (optional).

---

## Cost control (demo accounts)

**Idle agents do not incur model charges.** You pay mainly when invoking agents (Bedrock tokens) plus minimal S3/log storage.

- **Not testing for weeks?** Run `./scripts/destroy.sh` and redeploy before the next demo.
- **Set an AWS Budget** with email alerts (e.g. $25/month).

Full details: [docs/COSTS.md](docs/COSTS.md)

---

## Architecture

```
AwsAgenticDemo-Shared          → S3 RAG bucket (sample FAQ)
AwsAgenticDemo-BedrockAgent    → CustomerServiceAgent + over-privileged IAM role
AwsAgenticDemo-AgentCore       → SupportAgent runtime (direct code deploy, no Docker)
```

**Model:** Amazon Nova Lite (`us.amazon.nova-lite-v1:0` for Bedrock Agent inference profile)

---

## Verify in console

**Bedrock Agent:** Agents → `CustomerServiceAgent` → alias `live` → *What is the status of order 1001?*

**AgentCore:** AgentCore → Runtimes → `SupportAgent` → Test

**IAM trap:** Roles → `Bedrock_CustomerService_Agent_Role` → `AmazonS3FullAccess` attached

---

## Teardown

```bash
./scripts/destroy.sh
```

---

## Documentation

- [docs/TEAM-GUIDE.md](docs/TEAM-GUIDE.md) — sharing with other teams, production gaps
- [docs/COSTS.md](docs/COSTS.md) — idle vs active costs
- [docs/milestone-1-build-guide.md](docs/milestone-1-build-guide.md) — detailed build notes
- [blueprints/](blueprints/) — SailPoint demo scripts

---

## Next phase

SailPoint ISC CIEM connector, human access IAM users, certification campaigns.

---

## Requirements

- AWS CLI v2, Node.js 20+, Python 3 + pip3
- IAM: CloudFormation, IAM, Lambda, S3, Bedrock, Bedrock Agent, Bedrock AgentCore
- Bedrock Nova Lite available in target region
