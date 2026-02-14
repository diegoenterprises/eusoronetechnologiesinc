# EusoTrip Frontend - Complete AWS Infrastructure Setup Guide

**Project:** eusotrip-frontend  
**Date:** January 23, 2026  
**Scope:** RDS, Route53, S3, EC2, CloudFront, ACM, IAM, CloudWatch, Secrets Manager  

---

## TABLE OF CONTENTS

1. [AWS Account Prerequisites](#aws-account-prerequisites)
2. [IAM User Setup & Permissions](#iam-user-setup--permissions)
3. [RDS Database Setup](#rds-database-setup)
4. [S3 Bucket Configuration](#s3-bucket-configuration)
5. [Route53 DNS Configuration](#route53-dns-configuration)
6. [EC2 Instance Setup](#ec2-instance-setup)
7. [CloudFront CDN Configuration](#cloudfront-cdn-configuration)
8. [SSL/TLS Certificate Management](#ssltls-certificate-management)
9. [Secrets Manager Configuration](#secrets-manager-configuration)
10. [CloudWatch Monitoring](#cloudwatch-monitoring)
11. [VPC & Security Groups](#vpc--security-groups)
12. [Backup & Disaster Recovery](#backup--disaster-recovery)
13. [Cost Optimization](#cost-optimization)
14. [Troubleshooting](#troubleshooting)

---

## AWS ACCOUNT PREREQUISITES

### Required AWS Services

Before starting, ensure you have:
- ✅ AWS Account with billing enabled
- ✅ Root account access (for initial setup)
- ✅ Credit card on file
- ✅ AWS Organizations (optional, for multi-account management)

### AWS Region Selection

**Recommended:** `us-east-1` (N. Virginia)
- Lowest latency for most US users
- Most services available
- Best pricing
- Largest availability zones

**Alternative:** `us-west-2` (Oregon) or `eu-west-1` (Ireland)

### Estimated Monthly Costs

```
RDS MySQL 8.0 (db.t3.micro): $35-50/month
S3 Storage (100GB): $2-3/month
S3 Data Transfer (1TB): $85-100/month
EC2 t3.small (1 instance): $20-30/month
CloudFront (1TB): $85-100/month
Route53 (1 hosted zone): $0.50/month
NAT Gateway: $32-45/month
Secrets Manager: $0.40/month
CloudWatch Logs: $5-10/month
---
TOTAL ESTIMATED: $250-400/month
```

---

## IAM USER SETUP & PERMISSIONS

### Step 1: Create IAM User for Development Team

**Via AWS Console:**

1. Go to **IAM Dashboard** → **Users** → **Create user**
2. **User name:** `eusotrip-dev-team`
3. **Select AWS credential type:**
   - ✅ Access key (Programmatic access)
   - ✅ Password (AWS Management Console access)
4. **Set permissions:** Attach policies (see below)
5. **Create user** and save credentials

**Via AWS CLI:**

```bash
aws iam create-user --user-name eusotrip-dev-team

# Create access key
aws iam create-access-key --user-name eusotrip-dev-team

# Create console password
aws iam create-login-profile \
  --user-name eusotrip-dev-team \
  --password '[TEMPORARY_PASSWORD]' \
  --password-reset-required
```

### Step 2: Create IAM Policy for Development Team

**Policy Name:** `eusotrip-dev-infrastructure-policy`

**Policy Document (JSON):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RDSFullAccess",
      "Effect": "Allow",
      "Action": [
        "rds:CreateDBInstance",
        "rds:DeleteDBInstance",
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters",
        "rds:ModifyDBInstance",
        "rds:RebootDBInstance",
        "rds:StartDBInstance",
        "rds:StopDBInstance",
        "rds:CreateDBSnapshot",
        "rds:DeleteDBSnapshot",
        "rds:DescribeDBSnapshots",
        "rds:RestoreDBInstanceFromDBSnapshot",
        "rds:CreateDBParameterGroup",
        "rds:DeleteDBParameterGroup",
        "rds:DescribeDBParameterGroups",
        "rds:ModifyDBParameterGroup",
        "rds:CreateDBSecurityGroup",
        "rds:DeleteDBSecurityGroup",
        "rds:DescribeDBSecurityGroups",
        "rds:AuthorizeDBSecurityGroupIngress",
        "rds:RevokeDBSecurityGroupIngress",
        "rds:CreateDBSubnetGroup",
        "rds:DeleteDBSubnetGroup",
        "rds:DescribeDBSubnetGroups",
        "rds:ListTagsForResource",
        "rds:AddTagsToResource",
        "rds:RemoveTagsFromResource"
      ],
      "Resource": "arn:aws:rds:*:*:db/eusotrip-*"
    },
    {
      "Sid": "S3FullAccess",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketVersioning",
        "s3:PutBucketVersioning",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy",
        "s3:DeleteBucketPolicy",
        "s3:GetBucketCors",
        "s3:PutBucketCors",
        "s3:GetBucketAcl",
        "s3:PutBucketAcl",
        "s3:GetBucketLogging",
        "s3:PutBucketLogging",
        "s3:GetBucketPublicAccessBlock",
        "s3:PutBucketPublicAccessBlock",
        "s3:ListBucketVersions",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion",
        "s3:DeleteObjectVersion",
        "s3:GetObjectAcl",
        "s3:PutObjectAcl",
        "s3:ListAllMyBuckets",
        "s3:GetBucketTagging",
        "s3:PutBucketTagging"
      ],
      "Resource": [
        "arn:aws:s3:::eusotrip-*",
        "arn:aws:s3:::eusotrip-*/*"
      ]
    },
    {
      "Sid": "Route53FullAccess",
      "Effect": "Allow",
      "Action": [
        "route53:CreateHostedZone",
        "route53:DeleteHostedZone",
        "route53:GetHostedZone",
        "route53:ListHostedZones",
        "route53:ListHostedZonesByName",
        "route53:GetChange",
        "route53:ListResourceRecordSets",
        "route53:ChangeResourceRecordSets",
        "route53:GetHostedZoneCount",
        "route53:ListTagsForResource",
        "route53:ChangeTagsForResource",
        "route53:CreateQueryLoggingConfig",
        "route53:DeleteQueryLoggingConfig",
        "route53:ListQueryLoggingConfigs",
        "route53:GetDNSSEC",
        "route53:DisassociateVPCFromHostedZone"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2FullAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:RebootInstances",
        "ec2:CreateKeyPair",
        "ec2:DeleteKeyPair",
        "ec2:DescribeKeyPairs",
        "ec2:ImportKeyPair",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:DescribeSecurityGroups",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:CreateNetworkInterface",
        "ec2:DeleteNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:CreateVpc",
        "ec2:DeleteVpc",
        "ec2:DescribeVpcs",
        "ec2:CreateSubnet",
        "ec2:DeleteSubnet",
        "ec2:DescribeSubnets",
        "ec2:CreateInternetGateway",
        "ec2:DeleteInternetGateway",
        "ec2:DescribeInternetGateways",
        "ec2:AttachInternetGateway",
        "ec2:DetachInternetGateway",
        "ec2:CreateRouteTable",
        "ec2:DeleteRouteTable",
        "ec2:DescribeRouteTables",
        "ec2:CreateRoute",
        "ec2:DeleteRoute",
        "ec2:AssociateRouteTable",
        "ec2:DisassociateRouteTable",
        "ec2:AllocateAddress",
        "ec2:ReleaseAddress",
        "ec2:DescribeAddresses",
        "ec2:AssociateAddress",
        "ec2:DisassociateAddress",
        "ec2:CreateNatGateway",
        "ec2:DeleteNatGateway",
        "ec2:DescribeNatGateways",
        "ec2:CreateTags",
        "ec2:DeleteTags",
        "ec2:DescribeTags",
        "ec2:DescribeImages",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeAvailabilityZones"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudFrontFullAccess",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:DeleteDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:GetDistributionConfig",
        "cloudfront:ListDistributions",
        "cloudfront:UpdateDistribution",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations",
        "cloudfront:ListDistributionsByOriginRequestPolicyId",
        "cloudfront:GetOriginRequestPolicy",
        "cloudfront:ListOriginRequestPolicies",
        "cloudfront:CreateOriginRequestPolicy",
        "cloudfront:DeleteOriginRequestPolicy",
        "cloudfront:UpdateOriginRequestPolicy",
        "cloudfront:GetCachePolicy",
        "cloudfront:ListCachePolicies",
        "cloudfront:CreateCachePolicy",
        "cloudfront:DeleteCachePolicy",
        "cloudfront:UpdateCachePolicy",
        "cloudfront:TagResource",
        "cloudfront:UntagResource",
        "cloudfront:ListTagsForResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ACMFullAccess",
      "Effect": "Allow",
      "Action": [
        "acm:RequestCertificate",
        "acm:DeleteCertificate",
        "acm:DescribeCertificate",
        "acm:ListCertificates",
        "acm:ListTagsForCertificate",
        "acm:AddTagsToCertificate",
        "acm:RemoveTagsFromCertificate",
        "acm:ResendValidationEmail",
        "acm:GetCertificate",
        "acm:ImportCertificate",
        "acm:ExportCertificate"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SecretsManagerFullAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:CreateSecret",
        "secretsmanager:DeleteSecret",
        "secretsmanager:DescribeSecret",
        "secretsmanager:GetSecretValue",
        "secretsmanager:ListSecrets",
        "secretsmanager:PutSecretValue",
        "secretsmanager:UpdateSecret",
        "secretsmanager:RotateSecret",
        "secretsmanager:TagResource",
        "secretsmanager:UntagResource",
        "secretsmanager:ListSecretVersionIds",
        "secretsmanager:GetRandomPassword"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:eusotrip-*"
    },
    {
      "Sid": "CloudWatchFullAccess",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:DeleteAlarms",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:PutMetricData",
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:CreateLogStream",
        "logs:DeleteLogStream",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents",
        "logs:GetLogEvents",
        "logs:FilterLogEvents",
        "logs:CreateMetricFilter",
        "logs:DeleteMetricFilter",
        "logs:DescribeMetricFilters",
        "logs:PutRetentionPolicy"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/eusotrip/*"
    },
    {
      "Sid": "IAMReadOnly",
      "Effect": "Allow",
      "Action": [
        "iam:GetUser",
        "iam:ListUsers",
        "iam:GetRole",
        "iam:ListRoles",
        "iam:GetPolicy",
        "iam:ListPolicies",
        "iam:ListAttachedUserPolicies",
        "iam:ListAttachedRolePolicies",
        "iam:GetAccessKeyLastUsed",
        "iam:ListAccessKeys"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2ImageAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeImages",
        "ec2:DescribeImageAttribute"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ElasticLoadBalancingFullAccess",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:CreateLoadBalancer",
        "elasticloadbalancing:DeleteLoadBalancer",
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:ModifyLoadBalancerAttributes",
        "elasticloadbalancing:DescribeLoadBalancerAttributes",
        "elasticloadbalancing:CreateTargetGroup",
        "elasticloadbalancing:DeleteTargetGroup",
        "elasticloadbalancing:DescribeTargetGroups",
        "elasticloadbalancing:RegisterTargets",
        "elasticloadbalancing:DeregisterTargets",
        "elasticloadbalancing:DescribeTargetHealth",
        "elasticloadbalancing:CreateListener",
        "elasticloadbalancing:DeleteListener",
        "elasticloadbalancing:DescribeListeners",
        "elasticloadbalancing:ModifyListener",
        "elasticloadbalancing:AddTags",
        "elasticloadbalancing:RemoveTags",
        "elasticloadbalancing:DescribeTags"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DenyDangerousActions",
      "Effect": "Deny",
      "Action": [
        "iam:DeleteUser",
        "iam:DeleteAccessKey",
        "iam:DeleteLoginProfile",
        "iam:AttachUserPolicy",
        "iam:DetachUserPolicy",
        "iam:PutUserPolicy",
        "iam:DeleteUserPolicy",
        "iam:CreateAccessKey",
        "iam:CreateLoginProfile",
        "iam:UpdateAccessKey",
        "iam:UpdateLoginProfile",
        "organizations:LeaveOrganization",
        "account:CloseAccount"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SNSFullAccess",
      "Effect": "Allow",
      "Action": [
        "sns:CreateTopic",
        "sns:DeleteTopic",
        "sns:ListTopics",
        "sns:GetTopicAttributes",
        "sns:SetTopicAttributes",
        "sns:Subscribe",
        "sns:Unsubscribe",
        "sns:Publish",
        "sns:ListSubscriptions",
        "sns:ListSubscriptionsByTopic",
        "sns:TagResource",
        "sns:UntagResource",
        "sns:ListTagsForResource"
      ],
      "Resource": "arn:aws:sns:*:*:eusotrip-*"
    },
    {
      "Sid": "AutoScalingFullAccess",
      "Effect": "Allow",
      "Action": [
        "autoscaling:CreateAutoScalingGroup",
        "autoscaling:DeleteAutoScalingGroup",
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:UpdateAutoScalingGroup",
        "autoscaling:CreateLaunchConfiguration",
        "autoscaling:DeleteLaunchConfiguration",
        "autoscaling:DescribeLaunchConfigurations",
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup",
        "autoscaling:AttachInstances",
        "autoscaling:DetachInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 3: Attach Policy to IAM User

**Via AWS Console:**

1. Go to **IAM** → **Users** → **eusotrip-dev-team**
2. Click **Add permissions** → **Attach policies directly**
3. Search for `eusotrip-dev-infrastructure-policy`
4. Select and click **Add permissions**

**Via AWS CLI:**

```bash
aws iam put-user-policy \
  --user-name eusotrip-dev-team \
  --policy-name eusotrip-dev-infrastructure-policy \
  --policy-document file://policy.json
```

### Step 4: Create Access Keys for Programmatic Access

**Via AWS Console:**

1. Go to **IAM** → **Users** → **eusotrip-dev-team**
2. Click **Security credentials** tab
3. Click **Create access key**
4. Choose **Application running outside AWS**
5. Copy **Access Key ID** and **Secret Access Key**
6. Store securely (never commit to Git)

**Via AWS CLI:**

```bash
aws iam create-access-key --user-name eusotrip-dev-team

# Output:
# {
#   "AccessKey": {
#     "UserName": "eusotrip-dev-team",
#     "AccessKeyId": "AKIA...",
#     "Status": "Active",
#     "SecretAccessKey": "...",
#     "CreateDate": "2026-01-23T..."
#   }
# }
```

### Step 5: Configure AWS CLI for Development Team

**Create `~/.aws/credentials` file:**

```ini
[eusotrip-dev]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
region = us-east-1
```

**Create `~/.aws/config` file:**

```ini
[profile eusotrip-dev]
region = us-east-1
output = json
```

**Use in commands:**

```bash
aws s3 ls --profile eusotrip-dev
aws rds describe-db-instances --profile eusotrip-dev
```

---

## RDS DATABASE SETUP

### Step 1: Create RDS MySQL Instance

**Via AWS Console:**

1. Go to **RDS** → **Databases** → **Create database**
2. **Engine options:**
   - Engine type: **MySQL**
   - Version: **MySQL 8.0.35** (latest stable)
   - Edition: **MySQL Community Edition**

3. **Templates:**
   - Select: **Production** (for high availability)

4. **Settings:**
   - DB instance identifier: `eusotrip-prod-db`
   - Master username: `admin`
   - Master password: Generate strong password (save to Secrets Manager)
   - Confirm password: Repeat

5. **DB instance class:**
   - Burstable classes (includes t3): **db.t3.small**
   - Storage type: **General Purpose SSD (gp3)**
   - Allocated storage: **100 GB**
   - Storage autoscaling: **Enabled** (max 200 GB)

6. **Connectivity:**
   - VPC: Select your VPC (or create new)
   - DB subnet group: Create new or select existing
   - Public accessibility: **No** (access only from EC2)
   - VPC security group: Create new: `eusotrip-rds-sg`

7. **Database authentication:**
   - Database authentication: **Password authentication**

8. **Additional configuration:**
   - Initial database name: `eusotrip_prod`
   - DB parameter group: Create new: `eusotrip-mysql80-params`
   - DB option group: Default
   - Backup retention period: **30 days**
   - Backup window: **03:00-04:00 UTC**
   - Copy tags to snapshot: **Enabled**
   - Enable deletion protection: **Enabled**
   - Enable encryption: **Enabled**
   - KMS key: `aws/rds` (default)
   - Enable CloudWatch logs exports: **Error log, General log, Slow query log**
   - Enable Performance Insights: **Enabled**
   - Retention period: **7 days**
   - Enable Enhanced Monitoring: **Enabled**
   - Monitoring interval: **60 seconds**

9. **Maintenance:**
   - Maintenance window: **sun:04:00-sun:05:00 UTC**
   - Auto minor version upgrade: **Enabled**

10. Click **Create database**

**Via AWS CLI:**

```bash
aws rds create-db-instance \
  --db-instance-identifier eusotrip-prod-db \
  --db-instance-class db.t3.small \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username admin \
  --master-user-password '[STRONG_PASSWORD]' \
  --allocated-storage 100 \
  --storage-type gp3 \
  --db-name eusotrip_prod \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name eusotrip-db-subnet \
  --backup-retention-period 30 \
  --enable-cloudwatch-logs-exports error general slowquery \
  --enable-iam-database-authentication \
  --storage-encrypted \
  --enable-deletion-protection \
  --region us-east-1
```

### Step 2: Configure RDS Security Group

**Inbound Rules:**

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| MySQL/Aurora | TCP | 3306 | EC2 Security Group (sg-xxxxxxxx) |
| MySQL/Aurora | TCP | 3306 | Your IP (for local testing) |

**Via AWS Console:**

1. Go to **RDS** → **Databases** → **eusotrip-prod-db**
2. Click **VPC security groups**
3. Click security group ID
4. **Inbound rules** → **Edit inbound rules**
5. Add rules above
6. Save

**Via AWS CLI:**

```bash
# Get security group ID
SG_ID=$(aws rds describe-db-instances \
  --db-instance-identifier eusotrip-prod-db \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text)

# Add inbound rule for EC2
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3306 \
  --source-group sg-ec2-instance-id

# Add inbound rule for your IP
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3306 \
  --cidr YOUR_IP/32
```

### Step 3: Store RDS Credentials in Secrets Manager

**Via AWS Console:**

1. Go to **Secrets Manager** → **Store a new secret**
2. **Secret type:** Credentials for RDS database
3. **Username:** `admin`
4. **Password:** [Your RDS password]
5. **Database:** `eusotrip-prod-db`
6. **Secret name:** `eusotrip/rds/prod`
7. **Encryption key:** `aws/secretsmanager` (default)
8. **Rotation:** Enable automatic rotation (30 days)
9. Click **Store secret**

**Via AWS CLI:**

```bash
aws secretsmanager create-secret \
  --name eusotrip/rds/prod \
  --description "RDS credentials for EusoTrip production database" \
  --secret-string '{
    "username":"admin",
    "password":"[PASSWORD]",
    "engine":"mysql",
    "host":"eusotrip-prod-db.c9akciq32.us-east-1.rds.amazonaws.com",
    "port":3306,
    "dbname":"eusotrip_prod"
  }' \
  --region us-east-1
```

### Step 4: Connect to RDS and Create Application Database

**Get RDS Endpoint:**

```bash
aws rds describe-db-instances \
  --db-instance-identifier eusotrip-prod-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
# Output: eusotrip-prod-db.c9akciq32.us-east-1.rds.amazonaws.com
```

**Connect via MySQL CLI:**

```bash
mysql -h eusotrip-prod-db.c9akciq32.us-east-1.rds.amazonaws.com \
  -u admin \
  -p \
  -D eusotrip_prod
```

**Create Application User:**

```sql
-- Create application user
CREATE USER 'eusotrip_app'@'%' IDENTIFIED BY '[APP_PASSWORD]';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER 
  ON eusotrip_prod.* TO 'eusotrip_app'@'%';

-- Grant specific permissions for migrations
GRANT ALL PRIVILEGES ON eusotrip_prod.* TO 'eusotrip_app'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Verify
SHOW GRANTS FOR 'eusotrip_app'@'%';
```

**Store App Credentials in Secrets Manager:**

```bash
aws secretsmanager create-secret \
  --name eusotrip/rds/app \
  --description "Application user credentials for EusoTrip RDS" \
  --secret-string '{
    "username":"eusotrip_app",
    "password":"[APP_PASSWORD]",
    "engine":"mysql",
    "host":"eusotrip-prod-db.c9akciq32.us-east-1.rds.amazonaws.com",
    "port":3306,
    "dbname":"eusotrip_prod"
  }' \
  --region us-east-1
```

### Step 5: Run Database Migrations

**From EC2 Instance:**

```bash
# SSH to EC2
ssh -i eusotrip-key.pem ec2-user@[EC2_IP]

# Navigate to app directory
cd /home/ec2-user/eusotrip-frontend

# Create .env file with RDS connection
cat > .env.production << EOF
DATABASE_URL=mysql://eusotrip_app:[APP_PASSWORD]@eusotrip-prod-db.c9akciq32.us-east-1.rds.amazonaws.com:3306/eusotrip_prod?ssl=true
NODE_ENV=production
EOF

# Run migrations
pnpm db:push

# Verify tables created
mysql -h eusotrip-prod-db.c9akciq32.us-east-1.rds.amazonaws.com \
  -u eusotrip_app \
  -p \
  -D eusotrip_prod \
  -e "SHOW TABLES;"
```

### Step 6: Enable RDS Backup & Monitoring

**Automated Backups:**
- Already configured during instance creation
- Retention: 30 days
- Window: 03:00-04:00 UTC

**Manual Snapshots:**

```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier eusotrip-prod-db \
  --db-snapshot-identifier eusotrip-prod-snapshot-$(date +%Y%m%d)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier eusotrip-prod-db

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier eusotrip-prod-db-restore \
  --db-snapshot-identifier eusotrip-prod-snapshot-20260123
```

**CloudWatch Monitoring:**

```bash
# Get CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=eusotrip-prod-db \
  --start-time 2026-01-23T00:00:00Z \
  --end-time 2026-01-23T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum

# Get database connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=eusotrip-prod-db \
  --start-time 2026-01-23T00:00:00Z \
  --end-time 2026-01-23T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum
```

---

## S3 BUCKET CONFIGURATION

### Step 1: Create S3 Buckets

**Create Primary Bucket for Application Files:**

```bash
# Create bucket
aws s3api create-bucket \
  --bucket eusotrip-app-files \
  --region us-east-1 \
  --acl private

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket eusotrip-app-files \
  --versioning-configuration Status=Enabled

# Block all public access
aws s3api put-public-access-block \
  --bucket eusotrip-app-files \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket eusotrip-app-files \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

# Enable logging
aws s3api put-bucket-logging \
  --bucket eusotrip-app-files \
  --bucket-logging-status '{
    "LoggingEnabled": {
      "TargetBucket": "eusotrip-logs",
      "TargetPrefix": "s3-access-logs/"
    }
  }'

# Set lifecycle policy (delete old versions after 90 days)
aws s3api put-bucket-lifecycle-configuration \
  --bucket eusotrip-app-files \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "DeleteOldVersions",
        "Status": "Enabled",
        "NoncurrentVersionExpiration": {
          "NoncurrentDays": 90
        }
      },
      {
        "Id": "TransitionToIA",
        "Status": "Enabled",
        "Transitions": [
          {
            "Days": 30,
            "StorageClass": "STANDARD_IA"
          }
        ]
      }
    ]
  }'
```

**Create Logs Bucket:**

```bash
aws s3api create-bucket \
  --bucket eusotrip-logs \
  --region us-east-1 \
  --acl log-delivery-write

# Block public access
aws s3api put-public-access-block \
  --bucket eusotrip-logs \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### Step 2: Configure S3 Bucket Policy

**Allow CloudFront to Access:**

```bash
aws s3api put-bucket-policy \
  --bucket eusotrip-app-files \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowCloudFrontAccess",
        "Effect": "Allow",
        "Principal": {
          "Service": "cloudfront.amazonaws.com"
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::eusotrip-app-files/*",
        "Condition": {
          "StringEquals": {
            "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
          }
        }
      },
      {
        "Sid": "AllowApplicationAccess",
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::ACCOUNT_ID:role/eusotrip-ec2-role"
        },
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Resource": "arn:aws:s3:::eusotrip-app-files/*"
      }
    ]
  }'
```

### Step 3: Configure CORS for S3

```bash
aws s3api put-bucket-cors \
  --bucket eusotrip-app-files \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedOrigins": ["https://eusotrip.com", "https://www.eusotrip.com"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag", "x-amz-version-id"],
        "MaxAgeSeconds": 3000
      }
    ]
  }'
```

### Step 4: Create IAM Role for EC2 to Access S3

```bash
# Create trust policy
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name eusotrip-ec2-role \
  --assume-role-policy-document file://trust-policy.json

# Create policy for S3 access
cat > s3-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::eusotrip-app-files",
        "arn:aws:s3:::eusotrip-app-files/*"
      ]
    }
  ]
}
EOF

# Attach policy to role
aws iam put-role-policy \
  --role-name eusotrip-ec2-role \
  --policy-name eusotrip-s3-access \
  --policy-document file://s3-policy.json

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name eusotrip-ec2-profile

# Add role to instance profile
aws iam add-role-to-instance-profile \
  --instance-profile-name eusotrip-ec2-profile \
  --role-name eusotrip-ec2-role
```

### Step 5: Upload Static Assets

```bash
# Upload frontend build
aws s3 cp dist/ s3://eusotrip-app-files/frontend/ --recursive --cache-control "max-age=31536000"

# Upload images
aws s3 cp images/ s3://eusotrip-app-files/images/ --recursive --cache-control "max-age=2592000"

# Upload documents
aws s3 cp documents/ s3://eusotrip-app-files/documents/ --recursive

# List bucket contents
aws s3 ls s3://eusotrip-app-files/ --recursive
```

---

## ROUTE53 DNS CONFIGURATION

### Step 1: Create Hosted Zone

**Via AWS Console:**

1. Go to **Route 53** → **Hosted zones** → **Create hosted zone**
2. **Domain name:** `eusotrip.com`
3. **Type:** Public hosted zone
4. Click **Create hosted zone**

**Via AWS CLI:**

```bash
aws route53 create-hosted-zone \
  --name eusotrip.com \
  --caller-reference $(date +%s) \
  --hosted-zone-config Comment="EusoTrip production domain"
```

### Step 2: Get Nameservers

```bash
# Get hosted zone ID and nameservers
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name eusotrip.com \
  --query 'HostedZones[0].Id' \
  --output text | cut -d'/' -f3)

aws route53 get-hosted-zone \
  --id $ZONE_ID \
  --query 'DelegationSet.NameServers' \
  --output text
```

**Update Domain Registrar:**
- Go to your domain registrar (GoDaddy, Namecheap, etc.)
- Update nameservers to the 4 Route53 nameservers
- Wait 24-48 hours for propagation

### Step 3: Create DNS Records

**A Record (Root Domain):**

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "eusotrip.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "d111111abcdef8.cloudfront.net",
            "EvaluateTargetHealth": false
          }
        }
      }
    ]
  }'
```

**CNAME Record (www):**

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "www.eusotrip.com",
          "Type": "CNAME",
          "TTL": 300,
          "ResourceRecords": [
            {"Value": "eusotrip.com"}
          ]
        }
      }
    ]
  }'
```

**API Subdomain (Optional):**

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "api.eusotrip.com",
          "Type": "A",
          "AliasTarget": {
            "HostedZoneId": "Z35SXDOTRQ7X7K",
            "DNSName": "eusotrip-alb-123456.us-east-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true
          }
        }
      }
    ]
  }'
```

**MX Record (Email):**

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "eusotrip.com",
          "Type": "MX",
          "TTL": 3600,
          "ResourceRecords": [
            {"Value": "10 mail.eusotrip.com"}
          ]
        }
      }
    ]
  }'
```

**TXT Record (SPF):**

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "eusotrip.com",
          "Type": "TXT",
          "TTL": 3600,
          "ResourceRecords": [
            {"Value": "\"v=spf1 include:_spf.google.com ~all\""}
          ]
        }
      }
    ]
  }'
```

### Step 4: Verify DNS Resolution

```bash
# Test DNS resolution
nslookup eusotrip.com
dig eusotrip.com

# Check specific record
dig eusotrip.com A
dig www.eusotrip.com CNAME
dig api.eusotrip.com A

# Full DNS trace
dig +trace eusotrip.com
```

---

## EC2 INSTANCE SETUP

### Step 1: Create EC2 Instance

**Via AWS Console:**

1. Go to **EC2** → **Instances** → **Launch instances**
2. **Name:** `eusotrip-prod-server`
3. **AMI:** Amazon Linux 2 (or Ubuntu 22.04 LTS)
4. **Instance type:** `t3.small` (2 vCPU, 2 GB RAM)
5. **Key pair:** Create new: `eusotrip-prod-key`
6. **Network settings:**
   - VPC: Select your VPC
   - Subnet: Select public subnet
   - Auto-assign public IP: **Enabled**
   - Security group: Create new: `eusotrip-ec2-sg`
7. **Storage:**
   - Size: **50 GB**
   - Type: **gp3**
   - Delete on termination: **Yes**
   - Encrypted: **Yes**
8. **IAM instance profile:** `eusotrip-ec2-profile`
9. **Monitoring:** **Detailed CloudWatch monitoring**
10. **User data:** (See script below)
11. Click **Launch instance**

**User Data Script:**

```bash
#!/bin/bash
set -e

# Update system
yum update -y
yum install -y git curl wget nodejs npm

# Install Node.js 22
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
yum install -y nodejs

# Install pnpm
npm install -g pnpm

# Install MySQL client
yum install -y mysql

# Install PM2
npm install -g pm2

# Create application directory
mkdir -p /home/ec2-user/eusotrip-frontend
cd /home/ec2-user/eusotrip-frontend

# Clone repository
git clone https://github.com/diegoenterprises/eusoronetechnologiesinc.git .

# Install dependencies
pnpm install --frozen-lockfile

# Create .env file (will be filled by deployment script)
touch .env.production

# Build application
pnpm build

# Start with PM2
pm2 start "pnpm start" --name eusotrip-frontend
pm2 startup
pm2 save

# Setup log directory
mkdir -p /var/log/eusotrip-frontend
chown ec2-user:ec2-user /var/log/eusotrip-frontend

echo "EC2 instance setup complete"
```

**Via AWS CLI:**

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.small \
  --key-name eusotrip-prod-key \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --iam-instance-profile Name=eusotrip-ec2-profile \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=eusotrip-prod-server},{Key=Environment,Value=production}]' \
  --monitoring Enabled=true \
  --region us-east-1
```

### Step 2: Configure Security Group

**Inbound Rules:**

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| SSH | TCP | 22 | Your IP/0.0.0.0 (restrict to your IP) |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |

**Outbound Rules:**

| Type | Protocol | Port | Destination |
|------|----------|------|-------------|
| All traffic | All | All | 0.0.0.0/0 |

**Via AWS CLI:**

```bash
# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name eusotrip-ec2-sg \
  --description "Security group for EusoTrip EC2 instance" \
  --vpc-id vpc-xxxxxxxx \
  --query 'GroupId' \
  --output text)

# Add SSH rule
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP/32

# Add HTTP rule
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Add HTTPS rule
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

### Step 3: Allocate Elastic IP

```bash
# Allocate Elastic IP
ALLOCATION_ID=$(aws ec2 allocate-address \
  --domain vpc \
  --query 'AllocationId' \
  --output text)

# Get instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=eusotrip-prod-server" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

# Associate Elastic IP with instance
aws ec2 associate-address \
  --instance-id $INSTANCE_ID \
  --allocation-id $ALLOCATION_ID
```

### Step 4: Connect to EC2 Instance

```bash
# SSH into instance
ssh -i eusotrip-prod-key.pem ec2-user@[ELASTIC_IP]

# Or using instance ID
aws ec2-instance-connect send-ssh-public-key \
  --instance-id i-xxxxxxxx \
  --os-user ec2-user \
  --ssh-public-key file://~/.ssh/id_rsa.pub \
  --availability-zone us-east-1a
```

### Step 5: Deploy Application

```bash
# SSH to instance
ssh -i eusotrip-prod-key.pem ec2-user@[ELASTIC_IP]

# Navigate to app directory
cd /home/ec2-user/eusotrip-frontend

# Pull latest code
git pull origin production

# Create .env file with secrets
cat > .env.production << 'EOF'
DATABASE_URL=mysql://eusotrip_app:[APP_PASSWORD]@eusotrip-prod-db.c9akciq32.us-east-1.rds.amazonaws.com:3306/eusotrip_prod?ssl=true
VITE_APP_ID=[MANUS_APP_ID]
VITE_APP_TITLE=EusoTrip
VITE_APP_LOGO=[LOGO_URL]
JWT_SECRET=[JWT_SECRET]
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=[OWNER_ID]
OWNER_NAME=[OWNER_NAME]
NODE_ENV=production
PORT=3000
AWS_REGION=us-east-1
AWS_S3_BUCKET=eusotrip-app-files
EOF

# Install dependencies
pnpm install --frozen-lockfile

# Run migrations
pnpm db:push

# Build
pnpm build

# Start with PM2
pm2 restart eusotrip-frontend

# Check status
pm2 status
pm2 logs eusotrip-frontend
```

---

## CLOUDFRONT CDN CONFIGURATION

### Step 1: Create CloudFront Distribution

**Via AWS Console:**

1. Go to **CloudFront** → **Distributions** → **Create distribution**
2. **Origin domain:** `eusotrip-app-files.s3.us-east-1.amazonaws.com`
3. **S3 bucket access:**
   - Origin access: **Origin access control settings (recommended)**
   - Create new OAC: `eusotrip-s3-oac`
4. **Default cache behavior:**
   - Viewer protocol policy: **Redirect HTTP to HTTPS**
   - Allowed HTTP methods: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**
   - Cache policy: **CachingOptimized**
   - Origin request policy: **AllViewerExceptHostHeader**
5. **Alternate domain names (CNAME):**
   - `eusotrip.com`
   - `www.eusotrip.com`
6. **SSL certificate:** Select ACM certificate (see SSL section)
7. **Default root object:** `index.html`
8. **Custom error responses:**
   - 403 → `/index.html` (for SPA routing)
   - 404 → `/index.html` (for SPA routing)
9. **Logging:** Enable CloudFront logging to S3
10. Click **Create distribution**

**Via AWS CLI:**

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### Step 2: Update S3 Bucket Policy for CloudFront

```bash
# Get CloudFront OAC principal
OAC_PRINCIPAL=$(aws cloudfront get-origin-access-control \
  --id [OAC_ID] \
  --query 'OriginAccessControl.OriginAccessControlConfig.S3OriginConfig.OriginAccessIdentity' \
  --output text)

# Update bucket policy
aws s3api put-bucket-policy \
  --bucket eusotrip-app-files \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "cloudfront.amazonaws.com"
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::eusotrip-app-files/*",
        "Condition": {
          "StringEquals": {
            "AWS:SourceArn": "arn:aws:cloudfront::[ACCOUNT_ID]:distribution/[DISTRIBUTION_ID]"
          }
        }
      }
    ]
  }'
```

### Step 3: Invalidate CloudFront Cache

```bash
# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id [DISTRIBUTION_ID] \
  --paths "/*"

# Check invalidation status
aws cloudfront get-invalidation \
  --distribution-id [DISTRIBUTION_ID] \
  --id [INVALIDATION_ID]
```

---

## SSL/TLS CERTIFICATE MANAGEMENT

### Step 1: Request SSL Certificate

**Via AWS Console:**

1. Go to **ACM** → **Request certificate**
2. **Certificate type:** Public certificate
3. **Domain names:**
   - `eusotrip.com`
   - `*.eusotrip.com`
   - `www.eusotrip.com`
4. **Validation method:** DNS validation
5. Click **Request certificate**

**Via AWS CLI:**

```bash
aws acm request-certificate \
  --domain-name eusotrip.com \
  --subject-alternative-names "*.eusotrip.com" "www.eusotrip.com" \
  --validation-method DNS \
  --region us-east-1
```

### Step 2: Validate Certificate

**DNS Validation:**

1. Go to **ACM** → **Certificates** → Select certificate
2. Click **Create records in Route 53**
3. AWS automatically creates CNAME records in Route 53
4. Wait for validation (usually 5-15 minutes)

**Manual Validation:**

```bash
# Get validation records
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID \
  --query 'Certificate.DomainValidationOptions' \
  --output table

# Create Route 53 records manually if needed
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "[VALIDATION_CNAME_NAME]",
          "Type": "CNAME",
          "TTL": 300,
          "ResourceRecords": [
            {"Value": "[VALIDATION_CNAME_VALUE]"}
          ]
        }
      }
    ]
  }'
```

### Step 3: Use Certificate in CloudFront

1. Go to **CloudFront** → **Distributions** → Select distribution
2. Click **Edit**
3. **SSL certificate:** Select your ACM certificate
4. Click **Save changes**

---

## SECRETS MANAGER CONFIGURATION

### Step 1: Create Secrets

**RDS Admin Credentials:**

```bash
aws secretsmanager create-secret \
  --name eusotrip/rds/admin \
  --description "RDS admin credentials" \
  --secret-string '{
    "username":"admin",
    "password":"[STRONG_PASSWORD]",
    "engine":"mysql",
    "host":"eusotrip-prod-db.c9akciq32.us-east-1.rds.amazonaws.com",
    "port":3306,
    "dbname":"eusotrip_prod"
  }'
```

**Application Secrets:**

```bash
aws secretsmanager create-secret \
  --name eusotrip/app/secrets \
  --description "Application configuration secrets" \
  --secret-string '{
    "JWT_SECRET":"[RANDOM_JWT_SECRET]",
    "OAUTH_CLIENT_SECRET":"[OAUTH_SECRET]",
    "API_KEY":"[API_KEY]"
  }'
```

**API Keys:**

```bash
aws secretsmanager create-secret \
  --name eusotrip/api/keys \
  --description "Third-party API keys" \
  --secret-string '{
    "STRIPE_SECRET_KEY":"sk_live_...",
    "SENDGRID_API_KEY":"SG...."
  }'
```

### Step 2: Retrieve Secrets in Application

**Node.js:**

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });

async function getSecret(secretName: string) {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return JSON.parse(response.SecretString || "");
}

// Usage
const dbCredentials = await getSecret("eusotrip/rds/app");
const appSecrets = await getSecret("eusotrip/app/secrets");
```

### Step 3: Enable Automatic Rotation

```bash
# Enable rotation for RDS credentials
aws secretsmanager rotate-secret \
  --secret-id eusotrip/rds/admin \
  --rotation-rules AutomaticallyAfterDays=30 \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:ACCOUNT_ID:function/SecretsManagerRDSRotation
```

---

## CLOUDWATCH MONITORING

### Step 1: Create CloudWatch Alarms

**RDS CPU Utilization:**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name eusotrip-rds-cpu-high \
  --alarm-description "Alert when RDS CPU is high" \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=eusotrip-prod-db \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:eusotrip-alerts
```

**RDS Database Connections:**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name eusotrip-rds-connections-high \
  --alarm-description "Alert when database connections are high" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=eusotrip-prod-db \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:eusotrip-alerts
```

**EC2 CPU Utilization:**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name eusotrip-ec2-cpu-high \
  --alarm-description "Alert when EC2 CPU is high" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=InstanceId,Value=i-xxxxxxxx \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:eusotrip-alerts
```

### Step 2: Create SNS Topic for Alerts

```bash
# Create SNS topic
aws sns create-topic --name eusotrip-alerts

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:eusotrip-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### Step 3: Create CloudWatch Dashboard

```bash
aws cloudwatch put-dashboard \
  --dashboard-name eusotrip-prod \
  --dashboard-body file://dashboard-config.json
```

---

## VPC & SECURITY GROUPS

### Step 1: Create VPC

```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --query 'Vpc.VpcId' \
  --output text)

# Enable DNS hostnames
aws ec2 modify-vpc-attribute \
  --vpc-id $VPC_ID \
  --enable-dns-hostnames

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)

# Attach IGW to VPC
aws ec2 attach-internet-gateway \
  --internet-gateway-id $IGW_ID \
  --vpc-id $VPC_ID

# Create public subnet
PUBLIC_SUBNET=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --query 'Subnet.SubnetId' \
  --output text)

# Create private subnet
PRIVATE_SUBNET=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --query 'Subnet.SubnetId' \
  --output text)

# Create route table for public subnet
PUBLIC_RT=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --query 'RouteTable.RouteTableId' \
  --output text)

# Add route to IGW
aws ec2 create-route \
  --route-table-id $PUBLIC_RT \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID

# Associate route table with public subnet
aws ec2 associate-route-table \
  --subnet-id $PUBLIC_SUBNET \
  --route-table-id $PUBLIC_RT
```

### Step 2: Create Security Groups

**EC2 Security Group:**

```bash
EC2_SG=$(aws ec2 create-security-group \
  --group-name eusotrip-ec2-sg \
  --description "Security group for EC2 instances" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# SSH access
aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP/32

# HTTP
aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id $EC2_SG \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

**RDS Security Group:**

```bash
RDS_SG=$(aws ec2 create-security-group \
  --group-name eusotrip-rds-sg \
  --description "Security group for RDS database" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# MySQL from EC2
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 3306 \
  --source-group $EC2_SG

# MySQL from your IP (for local testing)
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 3306 \
  --cidr YOUR_IP/32
```

---

## BACKUP & DISASTER RECOVERY

### Step 1: RDS Automated Backups

Already configured during RDS creation:
- **Retention:** 30 days
- **Window:** 03:00-04:00 UTC
- **Multi-AZ:** Enabled (for high availability)

### Step 2: Create Manual Snapshots

```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier eusotrip-prod-db \
  --db-snapshot-identifier eusotrip-prod-snapshot-$(date +%Y%m%d-%H%M%S)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier eusotrip-prod-db

# Copy snapshot to another region (for disaster recovery)
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:us-east-1:ACCOUNT_ID:snapshot:eusotrip-prod-snapshot-20260123 \
  --target-db-snapshot-identifier eusotrip-prod-snapshot-dr \
  --source-region us-east-1 \
  --destination-region us-west-2
```

### Step 3: S3 Backup Strategy

```bash
# Enable versioning (already done)
aws s3api get-bucket-versioning --bucket eusotrip-app-files

# Create backup bucket
aws s3api create-bucket \
  --bucket eusotrip-app-files-backup \
  --region us-east-1

# Setup cross-region replication
aws s3api put-bucket-replication \
  --bucket eusotrip-app-files \
  --replication-configuration '{
    "Role": "arn:aws:iam::ACCOUNT_ID:role/s3-replication-role",
    "Rules": [
      {
        "Status": "Enabled",
        "Priority": 1,
        "DeleteMarkerReplication": {"Status": "Enabled"},
        "Filter": {"Prefix": ""},
        "Destination": {
          "Bucket": "arn:aws:s3:::eusotrip-app-files-backup",
          "ReplicationTime": {"Status": "Enabled", "Time": {"Minutes": 15}},
          "Metrics": {"Status": "Enabled", "EventThreshold": {"Minutes": 15}}
        }
      }
    ]
  }'
```

### Step 4: Disaster Recovery Plan

**RTO (Recovery Time Objective):** 1 hour  
**RPO (Recovery Point Objective):** 15 minutes

**Recovery Steps:**

1. **Database Recovery:**
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier eusotrip-prod-db-restored \
  --db-snapshot-identifier eusotrip-prod-snapshot-20260123

# Wait for restoration (typically 5-10 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier eusotrip-prod-db-restored

# Update application connection string
# Restart EC2 application
```

2. **S3 Recovery:**
```bash
# List all versions
aws s3api list-object-versions --bucket eusotrip-app-files

# Restore deleted object
aws s3api copy-object \
  --copy-source eusotrip-app-files/[KEY]?versionId=[VERSION_ID] \
  --key [KEY] \
  --bucket eusotrip-app-files
```

3. **Application Recovery:**
```bash
# SSH to EC2
ssh -i eusotrip-prod-key.pem ec2-user@[ELASTIC_IP]

# Pull latest code
cd /home/ec2-user/eusotrip-frontend
git pull origin production

# Restart application
pm2 restart eusotrip-frontend

# Verify
curl https://eusotrip.com/api/health
```

---

## COST OPTIMIZATION

### Step 1: Reserved Instances

```bash
# Purchase 1-year reserved instance for EC2
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id [OFFERING_ID] \
  --instance-count 1

# Purchase 1-year reserved instance for RDS
aws rds purchase-reserved-db-instances-offering \
  --reserved-db-instances-offering-id [OFFERING_ID] \
  --reserved-db-instance-count 1
```

**Estimated Savings:** 30-40% vs on-demand

### Step 2: S3 Lifecycle Policies

Already configured:
- Move to Standard-IA after 30 days
- Delete old versions after 90 days

### Step 3: CloudFront Cost Optimization

- Enable compression
- Use appropriate cache TTLs
- Monitor data transfer costs

### Step 4: RDS Optimization

- Use db.t3.small (burstable) instead of fixed instances
- Enable automated backups (cheaper than manual)
- Use Multi-AZ only for production

**Estimated Monthly Costs (Optimized):**

```
RDS db.t3.small (1-year RI): $20-25/month
S3 Storage (100GB): $2-3/month
S3 Data Transfer (1TB): $85-100/month
EC2 t3.small (1-year RI): $12-15/month
CloudFront (1TB): $85-100/month
Route53: $0.50/month
NAT Gateway: $32-45/month
Secrets Manager: $0.40/month
CloudWatch: $5-10/month
---
TOTAL: $240-300/month (with reserved instances)
```

---

## TROUBLESHOOTING

### RDS Connection Issues

```bash
# Test connection
mysql -h eusotrip-prod-db.c9akciq32.us-east-1.rds.amazonaws.com \
  -u admin \
  -p \
  -D eusotrip_prod

# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxxxxx

# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier eusotrip-prod-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Check RDS events
aws rds describe-events \
  --source-identifier eusotrip-prod-db \
  --source-type db-instance
```

### S3 Access Issues

```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket eusotrip-app-files

# Check bucket ACL
aws s3api get-bucket-acl --bucket eusotrip-app-files

# Check public access block
aws s3api get-public-access-block --bucket eusotrip-app-files

# Test upload
aws s3 cp test.txt s3://eusotrip-app-files/test.txt
```

### EC2 Connection Issues

```bash
# Check instance status
aws ec2 describe-instance-status --instance-ids i-xxxxxxxx

# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxxxxx

# Check network ACLs
aws ec2 describe-network-acls --filters "Name=association.subnet-id,Values=subnet-xxxxxxxx"

# SSH with verbose output
ssh -vvv -i eusotrip-prod-key.pem ec2-user@[ELASTIC_IP]
```

### DNS Resolution Issues

```bash
# Check Route53 records
aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID

# Test DNS resolution
nslookup eusotrip.com
dig eusotrip.com +trace

# Check CloudFront distribution
aws cloudfront get-distribution --id [DISTRIBUTION_ID]
```

---

## QUICK REFERENCE COMMANDS

### RDS

```bash
# Create instance
aws rds create-db-instance --db-instance-identifier eusotrip-prod-db ...

# Start instance
aws rds start-db-instance --db-instance-identifier eusotrip-prod-db

# Stop instance
aws rds stop-db-instance --db-instance-identifier eusotrip-prod-db

# Reboot instance
aws rds reboot-db-instance --db-instance-identifier eusotrip-prod-db

# Delete instance
aws rds delete-db-instance --db-instance-identifier eusotrip-prod-db --skip-final-snapshot
```

### S3

```bash
# Create bucket
aws s3api create-bucket --bucket eusotrip-app-files

# Upload file
aws s3 cp file.txt s3://eusotrip-app-files/

# List bucket
aws s3 ls s3://eusotrip-app-files/ --recursive

# Delete file
aws s3 rm s3://eusotrip-app-files/file.txt

# Delete bucket
aws s3 rb s3://eusotrip-app-files/ --force
```

### Route53

```bash
# List hosted zones
aws route53 list-hosted-zones

# List records
aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID

# Create record
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch ...

# Delete record
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch ...
```

### EC2

```bash
# List instances
aws ec2 describe-instances

# Start instance
aws ec2 start-instances --instance-ids i-xxxxxxxx

# Stop instance
aws ec2 stop-instances --instance-ids i-xxxxxxxx

# Terminate instance
aws ec2 terminate-instances --instance-ids i-xxxxxxxx

# SSH to instance
ssh -i key.pem ec2-user@[PUBLIC_IP]
```

---

## CONCLUSION

This comprehensive guide covers all AWS infrastructure needed for EusoTrip Frontend production deployment. Your development team should:

1. **Create IAM user** with provided permissions
2. **Set up RDS** MySQL database with proper security
3. **Configure S3** buckets for file storage
4. **Setup Route53** DNS with proper records
5. **Launch EC2** instance with application
6. **Configure CloudFront** for CDN
7. **Setup SSL/TLS** certificates
8. **Monitor** with CloudWatch
9. **Backup** regularly
10. **Optimize costs** with reserved instances

**Total Setup Time:** 2-4 hours  
**Monthly Cost:** $250-400 (with optimizations)  
**Support:** Refer to AWS documentation or contact AWS support

---

*Last Updated: January 23, 2026*  
*Maintained By: [Your Name]*
