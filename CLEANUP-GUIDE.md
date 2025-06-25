# Complete Cleanup Guide - Full-Stack Application

This guide provides comprehensive instructions to completely remove all AWS resources created for the full-stack application, including infrastructure, pipelines, and associated services.

## ⚠️ Important Warning

**This cleanup process will permanently delete:**
- All application data in RDS database
- All container images in ECR repositories
- All source code in CodeCommit repositories
- All pipeline execution history
- All EKS cluster and workloads
- All CloudFormation stacks

**Make sure to backup any important data before proceeding!**

---

## 🎯 Cleanup Sequence Overview

**Follow this exact order to avoid dependency issues:**

1. **🛑 Stop Pipelines** → Cancel running builds and disable triggers
2. **🗑️ Delete Applications** → Remove EKS deployments and services
3. **📦 Clean ECR** → Delete container images
4. **🔄 Delete Pipeline Stack** → Remove CI/CD infrastructure
5. **🏗️ Delete Infrastructure Stack** → Remove EKS, RDS, ECR, CodeCommit
6. **🔍 Delete SonarQube** → Terminate EC2 instance
7. **✅ Verify Cleanup** → Confirm all resources are deleted

---

## 📋 Prerequisites

### Required Tools
```bash
# Ensure you have the necessary tools
aws --version
kubectl version --client
```

### AWS Configuration
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Set region
export AWS_REGION=eu-north-1
```

---

## 🛑 STEP 1: Stop Active Pipelines

### 1.1 Cancel Running Builds
```bash
echo "🛑 Stopping active pipeline executions..."

# Get running pipeline executions
FRONTEND_EXECUTION=$(aws codepipeline list-pipeline-executions --pipeline-name fullstack-demo-frontend-pipeline --region $AWS_REGION --query 'pipelineExecutionSummaries[?status==`InProgress`].pipelineExecutionId' --output text)
BACKEND_EXECUTION=$(aws codepipeline list-pipeline-executions --pipeline-name fullstack-demo-backend-pipeline --region $AWS_REGION --query 'pipelineExecutionSummaries[?status==`InProgress`].pipelineExecutionId' --output text)

# Stop running executions
if [ ! -z "$FRONTEND_EXECUTION" ]; then
    echo "Stopping frontend pipeline execution: $FRONTEND_EXECUTION"
    aws codepipeline stop-pipeline-execution --pipeline-name fullstack-demo-frontend-pipeline --pipeline-execution-id $FRONTEND_EXECUTION --region $AWS_REGION
fi

if [ ! -z "$BACKEND_EXECUTION" ]; then
    echo "Stopping backend pipeline execution: $BACKEND_EXECUTION"
    aws codepipeline stop-pipeline-execution --pipeline-name fullstack-demo-backend-pipeline --pipeline-execution-id $BACKEND_EXECUTION --region $AWS_REGION
fi

echo "✅ Pipeline executions stopped"
```

### 1.2 Cancel Running Builds
```bash
echo "🛑 Cancelling active CodeBuild projects..."

# Cancel frontend builds
FRONTEND_BUILDS=$(aws codebuild list-builds-for-project --project-name fullstack-demo-frontend-build --region $AWS_REGION --query 'ids[?contains(@, `IN_PROGRESS`)]' --output text)
for build in $FRONTEND_BUILDS; do
    echo "Stopping frontend build: $build"
    aws codebuild stop-build --id $build --region $AWS_REGION
done

# Cancel backend builds
BACKEND_BUILDS=$(aws codebuild list-builds-for-project --project-name fullstack-demo-backend-build --region $AWS_REGION --query 'ids[?contains(@, `IN_PROGRESS`)]' --output text)
for build in $BACKEND_BUILDS; do
    echo "Stopping backend build: $build"
    aws codebuild stop-build --id $build --region $AWS_REGION
done

echo "✅ CodeBuild executions cancelled"
```

---

## 🗑️ STEP 2: Delete EKS Applications

### 2.1 Configure kubectl
```bash
echo "🔧 Configuring kubectl..."
aws eks update-kubeconfig --region $AWS_REGION --name fullstack-demo-eks-cluster 2>/dev/null || echo "EKS cluster may not exist"
```

### 2.2 Delete Application Deployments
```bash
echo "🗑️ Deleting EKS applications..."

# Delete deployments
kubectl delete deployment frontend backend --ignore-not-found=true

# Delete services
kubectl delete service frontend-service backend-service --ignore-not-found=true

# Delete secrets
kubectl delete secret db-secret --ignore-not-found=true

# Delete any remaining pods
kubectl delete pods --all --force --grace-period=0 --ignore-not-found=true

# Verify deletion
kubectl get deployments,services,pods

echo "✅ EKS applications deleted"
```

### 2.3 Delete LoadBalancers (Important!)
```bash
echo "🔗 Ensuring LoadBalancers are deleted..."

# Wait for LoadBalancer services to be fully deleted
echo "Waiting for LoadBalancer cleanup (this may take 5-10 minutes)..."
timeout 600 bash -c 'while kubectl get services 2>/dev/null | grep -q LoadBalancer; do echo "Waiting for LoadBalancers to delete..."; sleep 30; done' || echo "Timeout reached, continuing..."

echo "✅ LoadBalancers cleanup completed"
```

---

## 📦 STEP 3: Clean ECR Repositories

### 3.1 Delete Container Images
```bash
echo "📦 Cleaning ECR repositories..."

# Delete all images in frontend repository
aws ecr list-images --repository-name fullstack-demo-frontend --region $AWS_REGION --query 'imageIds[*]' --output json > /tmp/frontend-images.json 2>/dev/null
if [ -s /tmp/frontend-images.json ] && [ "$(cat /tmp/frontend-images.json)" != "[]" ]; then
    echo "Deleting frontend container images..."
    aws ecr batch-delete-image --repository-name fullstack-demo-frontend --image-ids file:///tmp/frontend-images.json --region $AWS_REGION
fi

# Delete all images in backend repository
aws ecr list-images --repository-name fullstack-demo-backend --region $AWS_REGION --query 'imageIds[*]' --output json > /tmp/backend-images.json 2>/dev/null
if [ -s /tmp/backend-images.json ] && [ "$(cat /tmp/backend-images.json)" != "[]" ]; then
    echo "Deleting backend container images..."
    aws ecr batch-delete-image --repository-name fullstack-demo-backend --image-ids file:///tmp/backend-images.json --region $AWS_REGION
fi

# Cleanup temp files
rm -f /tmp/frontend-images.json /tmp/backend-images.json

echo "✅ ECR repositories cleaned"
```

---

## 🔄 STEP 4: Delete Pipeline Stack

### 4.1 Delete Pipeline CloudFormation Stack
```bash
echo "🔄 Deleting pipeline stack..."

# Delete the pipeline stack
aws cloudformation delete-stack --stack-name fullstack-demo-pipeline --region $AWS_REGION

# Wait for deletion to complete
echo "Waiting for pipeline stack deletion (this may take 10-15 minutes)..."
aws cloudformation wait stack-delete-complete --stack-name fullstack-demo-pipeline --region $AWS_REGION

# Verify deletion
PIPELINE_STATUS=$(aws cloudformation describe-stacks --stack-name fullstack-demo-pipeline --region $AWS_REGION --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DELETED")
echo "Pipeline stack status: $PIPELINE_STATUS"

echo "✅ Pipeline stack deleted"
```

### 4.2 Clean Up Pipeline Artifacts
```bash
echo "🧹 Cleaning pipeline artifacts..."

# Delete S3 artifacts bucket
ARTIFACTS_BUCKET=$(aws s3 ls | grep fullstack-demo-artifacts | awk '{print $3}')
if [ ! -z "$ARTIFACTS_BUCKET" ]; then
    echo "Deleting artifacts bucket: $ARTIFACTS_BUCKET"
    aws s3 rm s3://$ARTIFACTS_BUCKET --recursive
    aws s3 rb s3://$ARTIFACTS_BUCKET --force
fi

echo "✅ Pipeline artifacts cleaned"
```

---

## 🏗️ STEP 5: Delete Infrastructure Stack

### 5.1 Delete Infrastructure CloudFormation Stack
```bash
echo "🏗️ Deleting infrastructure stack..."

# Delete the infrastructure stack
aws cloudformation delete-stack --stack-name fullstack-demo-infrastructure --region $AWS_REGION

# Wait for deletion to complete (this takes the longest)
echo "Waiting for infrastructure stack deletion (this may take 20-30 minutes)..."
aws cloudformation wait stack-delete-complete --stack-name fullstack-demo-infrastructure --region $AWS_REGION

# Verify deletion
INFRA_STATUS=$(aws cloudformation describe-stacks --stack-name fullstack-demo-infrastructure --region $AWS_REGION --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "DELETED")
echo "Infrastructure stack status: $INFRA_STATUS"

echo "✅ Infrastructure stack deleted"
```

### 5.2 Verify Resource Deletion
```bash
echo "🔍 Verifying infrastructure resource deletion..."

# Check EKS clusters
EKS_CLUSTERS=$(aws eks list-clusters --region $AWS_REGION --query 'clusters[?contains(@, `fullstack-demo`)]' --output text)
if [ ! -z "$EKS_CLUSTERS" ]; then
    echo "⚠️ Warning: EKS clusters still exist: $EKS_CLUSTERS"
else
    echo "✅ EKS clusters deleted"
fi

# Check RDS instances
RDS_INSTANCES=$(aws rds describe-db-instances --region $AWS_REGION --query 'DBInstances[?contains(DBInstanceIdentifier, `fullstack-demo`)].DBInstanceIdentifier' --output text)
if [ ! -z "$RDS_INSTANCES" ]; then
    echo "⚠️ Warning: RDS instances still exist: $RDS_INSTANCES"
else
    echo "✅ RDS instances deleted"
fi

# Check ECR repositories
ECR_REPOS=$(aws ecr describe-repositories --region $AWS_REGION --query 'repositories[?contains(repositoryName, `fullstack-demo`)].repositoryName' --output text)
if [ ! -z "$ECR_REPOS" ]; then
    echo "⚠️ Warning: ECR repositories still exist: $ECR_REPOS"
else
    echo "✅ ECR repositories deleted"
fi

# Check CodeCommit repositories
CODECOMMIT_REPOS=$(aws codecommit list-repositories --region $AWS_REGION --query 'repositories[?contains(repositoryName, `fullstack-demo`)].repositoryName' --output text)
if [ ! -z "$CODECOMMIT_REPOS" ]; then
    echo "⚠️ Warning: CodeCommit repositories still exist: $CODECOMMIT_REPOS"
else
    echo "✅ CodeCommit repositories deleted"
fi
```

---

## 🔍 STEP 6: Delete SonarQube Instance

### 6.1 Find and Terminate SonarQube EC2 Instance
```bash
echo "🔍 Finding and terminating SonarQube EC2 instance..."

# Find SonarQube instance
SONAR_INSTANCE=$(aws ec2 describe-instances --region $AWS_REGION --filters "Name=tag:Name,Values=*sonar*" "Name=instance-state-name,Values=running,stopped" --query 'Reservations[*].Instances[*].InstanceId' --output text)

if [ ! -z "$SONAR_INSTANCE" ]; then
    echo "Found SonarQube instance: $SONAR_INSTANCE"
    echo "Terminating SonarQube instance..."
    aws ec2 terminate-instances --instance-ids $SONAR_INSTANCE --region $AWS_REGION
    
    # Wait for termination
    echo "Waiting for instance termination..."
    aws ec2 wait instance-terminated --instance-ids $SONAR_INSTANCE --region $AWS_REGION
    echo "✅ SonarQube instance terminated"
else
    echo "✅ No SonarQube instance found"
fi
```

### 6.2 Clean Up SonarQube Security Groups
```bash
echo "🔒 Cleaning up SonarQube security groups..."

# Find and delete SonarQube security groups
SONAR_SG=$(aws ec2 describe-security-groups --region $AWS_REGION --filters "Name=group-name,Values=*sonar*" --query 'SecurityGroups[*].GroupId' --output text)

if [ ! -z "$SONAR_SG" ]; then
    echo "Deleting SonarQube security group: $SONAR_SG"
    aws ec2 delete-security-group --group-id $SONAR_SG --region $AWS_REGION 2>/dev/null || echo "Security group may have dependencies"
fi

echo "✅ SonarQube cleanup completed"
```

---

## ✅ STEP 7: Final Verification

### 7.1 Comprehensive Resource Check
```bash
echo "🔍 Performing final verification..."

echo "=== CLOUDFORMATION STACKS ==="
aws cloudformation list-stacks --region $AWS_REGION --query 'StackSummaries[?contains(StackName, `fullstack-demo`) && StackStatus != `DELETE_COMPLETE`].{Name:StackName,Status:StackStatus}' --output table

echo "=== EKS CLUSTERS ==="
aws eks list-clusters --region $AWS_REGION --query 'clusters[?contains(@, `fullstack-demo`)]' --output table

echo "=== RDS INSTANCES ==="
aws rds describe-db-instances --region $AWS_REGION --query 'DBInstances[?contains(DBInstanceIdentifier, `fullstack-demo`)].{ID:DBInstanceIdentifier,Status:DBInstanceStatus}' --output table

echo "=== ECR REPOSITORIES ==="
aws ecr describe-repositories --region $AWS_REGION --query 'repositories[?contains(repositoryName, `fullstack-demo`)].{Name:repositoryName,URI:repositoryUri}' --output table

echo "=== CODECOMMIT REPOSITORIES ==="
aws codecommit list-repositories --region $AWS_REGION --query 'repositories[?contains(repositoryName, `fullstack-demo`)].{Name:repositoryName,ID:repositoryId}' --output table

echo "=== EC2 INSTANCES ==="
aws ec2 describe-instances --region $AWS_REGION --filters "Name=tag:Name,Values=*sonar*" "Name=instance-state-name,Values=running,stopped,stopping" --query 'Reservations[*].Instances[*].{ID:InstanceId,State:State.Name,Name:Tags[?Key==`Name`].Value|[0]}' --output table

echo "=== S3 BUCKETS ==="
aws s3 ls | grep fullstack-demo || echo "No fullstack-demo S3 buckets found"
```

### 7.2 Cost Verification
```bash
echo "💰 Checking for remaining costs..."

# Note: Cost data may take 24-48 hours to reflect
echo "Important: Check AWS Billing Console in 24-48 hours to verify no ongoing charges"
echo "Services to monitor:"
echo "- EC2 instances"
echo "- RDS databases"
echo "- EKS clusters"
echo "- NAT Gateways"
echo "- Load Balancers"
echo "- S3 storage"
```

---

## 🚨 Troubleshooting Cleanup Issues

### Stack Deletion Failures
```bash
# If stack deletion fails, check dependencies
aws cloudformation describe-stack-events --stack-name STACK_NAME --region $AWS_REGION --query 'StackEvents[?ResourceStatus==`DELETE_FAILED`].{Resource:LogicalResourceId,Reason:ResourceStatusReason}' --output table

# Force delete stack (use with caution)
# aws cloudformation delete-stack --stack-name STACK_NAME --region $AWS_REGION --retain-resources RESOURCE_NAME
```

### Manual Resource Cleanup
```bash
# If automated cleanup fails, manually delete resources:

# Delete EKS cluster
aws eks delete-cluster --name fullstack-demo-eks-cluster --region $AWS_REGION

# Delete RDS instance
aws rds delete-db-instance --db-instance-identifier fullstack-demo-db --skip-final-snapshot --region $AWS_REGION

# Delete ECR repositories
aws ecr delete-repository --repository-name fullstack-demo-frontend --force --region $AWS_REGION
aws ecr delete-repository --repository-name fullstack-demo-backend --force --region $AWS_REGION

# Delete CodeCommit repositories
aws codecommit delete-repository --repository-name fullstack-demo-frontend-repo --region $AWS_REGION
aws codecommit delete-repository --repository-name fullstack-demo-backend-repo --region $AWS_REGION
```

### VPC Cleanup Issues
```bash
# If VPC deletion fails due to dependencies
echo "Checking VPC dependencies..."

VPC_ID=$(aws ec2 describe-vpcs --region $AWS_REGION --filters "Name=tag:Name,Values=*fullstack-demo*" --query 'Vpcs[0].VpcId' --output text)

if [ "$VPC_ID" != "None" ] && [ ! -z "$VPC_ID" ]; then
    echo "VPC ID: $VPC_ID"
    
    # Check for remaining ENIs
    aws ec2 describe-network-interfaces --region $AWS_REGION --filters "Name=vpc-id,Values=$VPC_ID" --query 'NetworkInterfaces[*].{ID:NetworkInterfaceId,Status:Status,Type:InterfaceType}'
    
    # Check for remaining security groups
    aws ec2 describe-security-groups --region $AWS_REGION --filters "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[?GroupName!=`default`].{ID:GroupId,Name:GroupName}'
fi
```

---

## 📋 Cleanup Checklist

### Before Starting ✅
- [ ] Backup any important data from RDS
- [ ] Export any needed container images from ECR
- [ ] Save any important code from CodeCommit
- [ ] Document any custom configurations

### Cleanup Steps ✅
- [ ] Stop all running pipelines and builds
- [ ] Delete EKS applications and services
- [ ] Wait for LoadBalancers to be deleted
- [ ] Clean ECR container images
- [ ] Delete pipeline CloudFormation stack
- [ ] Delete infrastructure CloudFormation stack
- [ ] Terminate SonarQube EC2 instance
- [ ] Verify all resources are deleted

### Post-Cleanup ✅
- [ ] Check AWS Billing Console for ongoing charges
- [ ] Verify no unexpected resources remain
- [ ] Monitor costs for 24-48 hours
- [ ] Remove any local kubectl configurations
- [ ] Clean up local git remotes if needed

---

## 💡 Quick Cleanup Script

For experienced users, here's a complete cleanup script:

```bash
#!/bin/bash
# Complete cleanup script - USE WITH CAUTION!

set -e
export AWS_REGION=eu-north-1

echo "🚨 WARNING: This will delete ALL fullstack-demo resources!"
read -p "Are you sure? Type 'DELETE' to continue: " confirm
if [ "$confirm" != "DELETE" ]; then
    echo "Cleanup cancelled"
    exit 1
fi

echo "🛑 Stopping pipelines..."
# Stop pipeline executions (add your pipeline stop commands here)

echo "🗑️ Deleting EKS applications..."
kubectl delete deployment,service,secret --all --ignore-not-found=true

echo "📦 Cleaning ECR..."
# Clean ECR repositories (add your ECR cleanup commands here)

echo "🔄 Deleting pipeline stack..."
aws cloudformation delete-stack --stack-name fullstack-demo-pipeline --region $AWS_REGION
aws cloudformation wait stack-delete-complete --stack-name fullstack-demo-pipeline --region $AWS_REGION

echo "🏗️ Deleting infrastructure stack..."
aws cloudformation delete-stack --stack-name fullstack-demo-infrastructure --region $AWS_REGION
aws cloudformation wait stack-delete-complete --stack-name fullstack-demo-infrastructure --region $AWS_REGION

echo "🔍 Terminating SonarQube..."
# Terminate SonarQube instance (add your termination commands here)

echo "✅ Cleanup completed!"
```

---

## 🎉 Cleanup Complete!

After following this guide, all AWS resources for the full-stack application should be completely removed. 

**Remember to:**
- Monitor your AWS billing for 24-48 hours
- Check for any unexpected charges
- Remove local configurations (kubectl, git remotes)
- Keep this guide for future reference

**Your AWS account is now clean and ready for new projects!** 🚀
