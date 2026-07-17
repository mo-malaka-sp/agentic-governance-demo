# Blueprint 1: AWS (The Over-Privileged Bedrock Agent)

**Objective:** Show CIEM discovering over-provisioned access on a Bedrock/Lambda execution role and right-sizing it via an ISC Certification.

## Step 1: Deploy vulnerable AWS infrastructure (The Trap)

Deploy with CDK (recommended):

```bash
./scripts/setup-and-deploy.sh
```

Or manually verify in IAM:

- Role: `Bedrock_CustomerService_Agent_Role`
- Trust: `bedrock.amazonaws.com`, `lambda.amazonaws.com`
- **Trap:** managed policy `AmazonS3FullAccess` (not scoped to the RAG bucket)

## Step 2: Configure SailPoint CIEM

1. In ISC, go to **Connections → Sources** and create **AWS (Full CIEM) Connector**
2. Deploy the SailPoint CloudFormation template (cross-account CIEM scanner role)
3. Run aggregation; wait for CIEM pipeline
4. Open **Cloud Access (CIEM)** and verify `Bedrock_CustomerService_Agent_Role` appears

## Step 3: Demo flow (ISC)

1. **Certifications → Campaigns**
2. Create a **Targeted Campaign** for AWS machine identities / roles
3. Preview — role should show `AmazonS3FullAccess`
4. Demo **Revoke** or replace with scoped policy

## Live agent test

Bedrock → Agents → `CustomerServiceAgent` → alias `live`:

*"What is the status of order 1001?"*
