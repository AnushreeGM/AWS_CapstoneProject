#!/bin/bash

# Infrastructure Deployment Script
# This script deploys the complete infrastructure for the full-stack application

set -e

echo "🚀 Starting Infrastructure Deployment..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: $AWS_ACCOUNT_ID"

# Deploy infrastructure stack
echo "🏗️ Deploying infrastructure stack..."
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

echo "✅ Infrastructure deployment completed!"

# Configure kubectl
echo "🔧 Configuring kubectl for EKS..."
aws eks update-kubeconfig --region eu-north-1 --name fullstack-demo-eks-cluster

# Verify EKS connection
echo "🔍 Verifying EKS connection..."
kubectl get nodes

# Get and display outputs
echo "📋 Infrastructure Outputs:"
RDS_ENDPOINT=$(aws cloudformation describe-stacks --stack-name fullstack-demo-infrastructure --region eu-north-1 --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" --output text)
FRONTEND_REPO=$(aws cloudformation describe-stacks --stack-name fullstack-demo-infrastructure --region eu-north-1 --query "Stacks[0].Outputs[?OutputKey=='FrontendCodeCommitCloneURL'].OutputValue" --output text)
BACKEND_REPO=$(aws cloudformation describe-stacks --stack-name fullstack-demo-infrastructure --region eu-north-1 --query "Stacks[0].Outputs[?OutputKey=='BackendCodeCommitCloneURL'].OutputValue" --output text)

echo "🗄️ RDS Endpoint: $RDS_ENDPOINT"
echo "📦 Frontend Repository: $FRONTEND_REPO"
echo "📦 Backend Repository: $BACKEND_REPO"

echo ""
echo "🎉 Infrastructure deployment successful!"
echo "📚 Next steps: Follow the DEPLOYMENT-GUIDE.md for pipeline setup"
