# Demo environment — cost guide

## Short answer

**If you are not invoking the agents, ongoing cost is very low** — mostly idle storage (S3, CloudFormation metadata, ECR/CDK bootstrap assets). There are **no always-on EC2 instances**.

**You pay meaningfully only when you invoke agents** (Bedrock model tokens) or when resources exist that accumulate storage/logs.

---

## Cost when idle (not testing)

| Resource | Idle cost |
|----------|-----------|
| **Bedrock Agent** | No inference charge. Agent definition is free to keep deployed. |
| **AgentCore Runtime** | No per-minute charge when no sessions are active. Runtime scales to zero between invocations. |
| **Lambda** (order lookup) | Free unless invoked (pay per request). |
| **S3** (RAG bucket + CDK assets) | Cents/month for small objects. |
| **CloudWatch Logs** | Small storage charge if logs were written during tests. |
| **CloudFormation / IAM** | No charge. |

Typical idle demo footprint: **under ~$1–5/month** unless logs/storage grow.

---

## Cost when testing (main driver)

| Activity | What you pay for |
|----------|------------------|
| Bedrock Agent test / invoke | **Nova Lite tokens** (input + output) |
| AgentCore invoke | **Nova Lite tokens** |
| Lambda tool call | Minimal per-invocation (usually negligible vs. model) |

Nova Lite is a low-cost model, but repeated testing adds up. Use short prompts during dev.

---

## How to minimize cost

1. **Destroy when not demoing**

   ```bash
   ./scripts/destroy.sh
   ```

   Redeploy before the next session with `./scripts/setup-and-deploy.sh`.

2. **Set an AWS Budget** (recommended for shared demo accounts)

   - AWS Billing → **Budgets** → create monthly budget with email alert (e.g. $25).

3. **Avoid automated polling** — don’t leave scripts hitting agents on a schedule.

4. **AgentCore lifecycle** — default idle session timeout is 15 minutes; sessions stop billing activity after idle (model charges only during active inference).

5. **Clean up old log groups** if you redeploy often (optional).

---

## After teardown

`cdk destroy --all` removes demo stacks. CDK bootstrap bucket (`cdk-hnb659fds-*`) may remain — negligible cost. Delete manually if you want zero footprint:

```bash
aws cloudformation delete-stack --stack-name CDKToolkit --profile YOUR_PROFILE
```

---

## Not a cost optimization project

This repo prioritizes **SailPoint CIEM demo clarity** over cost tuning. For production, use scoped IAM, KB instead of broad S3 access, and right-sized models.
