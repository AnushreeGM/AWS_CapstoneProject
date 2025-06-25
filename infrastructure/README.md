# Infrastructure

This directory contains the AWS infrastructure templates and deployment scripts for the full-stack application.

## Files

### `infrastructure.yaml`
**Main CloudFormation template** that creates:
- **EKS Cluster**: Kubernetes orchestration platform
- **RDS MySQL**: Managed database service
- **ECR Repositories**: Container image storage
- **CodeCommit Repositories**: Source code repositories
- **VPC & Networking**: Secure network infrastructure
- **IAM Roles**: Required permissions for services

### `deploy.sh`
**Deployment script** that:
- Validates AWS CLI configuration
- Deploys the infrastructure stack
- Configures kubectl for EKS
- Displays infrastructure outputs

## Quick Deployment

```bash
# Deploy infrastructure
./deploy.sh
```

## Manual Deployment

```bash
# Deploy infrastructure stack
aws cloudformation deploy \
  --template-file infrastructure.yaml \
  --stack-name fullstack-demo-infrastructure \
  --parameter-overrides \
    ProjectName="fullstack-demo" \
    VpcCIDR="10.0.0.0/16" \
    PublicSubnet1CIDR="10.0.1.0/24" \
    PublicSubnet2CIDR="10.0.2.0/24" \
    PrivateSubnet1CIDR="10.0.3.0/24" \
    PrivateSubnet2CIDR="10.0.4.0/24" \
    DBUsername="admin" \
    DBPassword="MySecurePass123!" \
  --capabilities CAPABILITY_IAM \
  --region eu-north-1

# Configure kubectl
aws eks update-kubeconfig --region eu-north-1 --name fullstack-demo-eks-cluster
```

## Infrastructure Components

### EKS Cluster
- **Node Group**: 2-4 t3.medium instances
- **Networking**: Private subnets with NAT Gateway
- **Security**: Managed node groups with auto-scaling

### RDS MySQL
- **Engine**: MySQL 8.0
- **Instance**: db.t3.micro (free tier eligible)
- **Storage**: 20GB with auto-scaling
- **Backup**: 7-day retention

### ECR Repositories
- **Frontend**: Container images for React app
- **Backend**: Container images for Node.js API
- **Lifecycle**: Automatic cleanup of old images

### CodeCommit Repositories
- **Frontend**: Source code for React application
- **Backend**: Source code for Node.js API
- **Access**: HTTPS clone URLs provided as outputs

## Outputs

After deployment, the stack provides:
- RDS endpoint for database connection
- ECR repository URIs for container images
- CodeCommit clone URLs for source code
- EKS cluster name for kubectl configuration

## Cleanup

```bash
# Delete infrastructure stack
aws cloudformation delete-stack --stack-name fullstack-demo-infrastructure --region eu-north-1
```

**Note**: This will delete all resources including the database. Make sure to backup any important data first.
