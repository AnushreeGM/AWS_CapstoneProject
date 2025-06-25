# Full-Stack Application - Complete Deployment Guide

This single guide contains everything needed to deploy and maintain the full-stack application with CI/CD pipeline, SonarQube integration, and AWS infrastructure.

## 🎯 Live Application URLs
- **Frontend**: http://abe21695d7ed44d1faaec8cf89cba82e-265517136.eu-north-1.elb.amazonaws.com
- **Backend**: http://ac4a09d0aa27548a2983bd7e6deac691-275729803.eu-north-1.elb.amazonaws.com
- **SonarQube**: http://13.51.161.9 (admin/Admin@123456)

---

## 📋 Prerequisites & Setup

### Required Tools Installation
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/

# Install Docker
sudo apt update && sudo apt install docker.io git -y
sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -aG docker $USER

# Configure AWS
aws configure
# Enter: Access Key, Secret Key, Region: eu-north-1, Format: json
aws sts get-caller-identity  # Verify
```

---

## 🎯 Deployment Sequence Overview

**Important**: Follow these steps in the exact order for successful deployment:

1. **🏗️ Infrastructure** → Deploy EKS, RDS, ECR, CodeCommit
2. **🔍 SonarQube** → Launch EC2, create projects, generate tokens
3. **🚀 Pipeline** → Deploy CI/CD pipeline with SonarQube integration
4. **📦 Source Code** → Push frontend and backend code to repositories
5. **🔄 Execute** → Trigger pipelines and monitor deployment
6. **🌐 Verify** → Test application and SonarQube integration

---

## 🏗️ STEP 1: Infrastructure Deployment

### Deploy Core Infrastructure (EKS, RDS, ECR, CodeCommit)
```bash
cd infrastructure

# Option 1: Quick deployment with script
./deploy.sh

# Option 2: Manual deployment
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

# Configure kubectl for EKS (if not using deploy.sh)
aws eks update-kubeconfig --region eu-north-1 --name fullstack-demo-eks-cluster
kubectl get nodes  # Verify

# Get infrastructure outputs
RDS_ENDPOINT=$(aws cloudformation describe-stacks --stack-name fullstack-demo-infrastructure --region eu-north-1 --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" --output text)
FRONTEND_REPO=$(aws cloudformation describe-stacks --stack-name fullstack-demo-infrastructure --region eu-north-1 --query "Stacks[0].Outputs[?OutputKey=='FrontendCodeCommitCloneURL'].OutputValue" --output text)
BACKEND_REPO=$(aws cloudformation describe-stacks --stack-name fullstack-demo-infrastructure --region eu-north-1 --query "Stacks[0].Outputs[?OutputKey=='BackendCodeCommitCloneURL'].OutputValue" --output text)

echo "RDS Endpoint: $RDS_ENDPOINT"
echo "Frontend Repo: $FRONTEND_REPO"
echo "Backend Repo: $BACKEND_REPO"
```

---

## 🔍 STEP 2: SonarQube Setup

### 2.1 Launch SonarQube EC2 Instance
```bash
cd cloudformation

# Run SonarQube setup script
chmod +x setup-sonarqube.sh && ./setup-sonarqube.sh

# Wait 5-10 minutes for SonarQube to start
# Check EC2 Console for the instance public IP
```

### 2.2 Access and Configure SonarQube
```bash
# Get your SonarQube EC2 public IP from AWS Console
SONAR_IP="YOUR_EC2_PUBLIC_IP"
echo "SonarQube URL: http://$SONAR_IP:9000"

# Access SonarQube in browser: http://YOUR_EC2_PUBLIC_IP:9000
# Default login: admin / admin
```

### 2.3 Initial SonarQube Configuration
**Manual steps in SonarQube web interface:**

1. **Login**: Use `admin` / `admin`
2. **Change Password**: Set new password to `Admin@123456`
3. **Skip Tutorial**: Click "Skip this tutorial"

### 2.4 Create SonarQube Projects
**Create Frontend Project:**
1. Click **"Create Project"** → **"Manually"**
2. **Project Key**: `fullstack-demo-frontend`
3. **Display Name**: `Frontend React App`
4. Click **"Set Up"**

**Create Backend Project:**
1. Click **"Create Project"** → **"Manually"**
2. **Project Key**: `fullstack-demo-backend`
3. **Display Name**: `Backend Node.js App`
4. Click **"Set Up"**

### 2.5 Generate Authentication Token
**For Frontend Project:**
1. In frontend project → **"Locally"** → **"Generate a token"**
2. **Token Name**: `frontend-pipeline-token`
3. **Expires**: Never
4. Click **"Generate"**
5. **Copy the token** (e.g., `squ_a8096a6e1c7cda5b7ce12d279f0444de74ee50f1`)

**For Backend Project:**
1. In backend project → **"Locally"** → **"Generate a token"**
2. **Token Name**: `backend-pipeline-token`
3. **Expires**: Never
4. Click **"Generate"**
5. **Copy the token** (same token can be used for both projects)

### 2.6 Note Your Configuration
```bash
# Save your SonarQube configuration for pipeline deployment
echo "SonarQube IP: $SONAR_IP"
echo "SonarQube Token: $SONAR_TOKEN"
echo ""
echo "✅ SonarQube setup complete!"
echo "📝 Note: You'll use these values in Step 3 for pipeline deployment"
```

**Important**: Keep your SonarQube IP and token handy - you'll need them for pipeline deployment in Step 3.

---

## 🚀 STEP 3: CI/CD Pipeline Deployment

### Deploy Pipeline Stack
```bash
cd cloudformation

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Deploy pipeline (5-10 minutes)
# Note: Replace SONAR_IP and SONAR_TOKEN with your actual values from Step 2
SONAR_IP="YOUR_EC2_PUBLIC_IP"  # From Step 2.2
SONAR_TOKEN="YOUR_GENERATED_TOKEN"  # From Step 2.5

aws cloudformation deploy \
  --template-file pipeline.yaml \
  --stack-name fullstack-demo-pipeline \
  --parameter-overrides \
    ProjectName="fullstack-demo" \
    RDSEndpoint="$RDS_ENDPOINT" \
    AWSAccountId="$AWS_ACCOUNT_ID" \
    SonarQubeHostURL="http://$SONAR_IP:9000" \
    SonarQubeToken="$SONAR_TOKEN" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-north-1

# Configure EKS authentication for CodeBuild
cat > aws-auth-config.yaml << EOF
apiVersion: v1
data:
  mapRoles: |
    - groups:
      - system:bootstrappers
      - system:nodes
      rolearn: arn:aws:iam::$AWS_ACCOUNT_ID:role/fullstack-demo-infrastructure-EKSNodeGroupRole-*
      username: system:node:{{EC2PrivateDNSName}}
    - groups:
      - system:masters
      rolearn: arn:aws:iam::$AWS_ACCOUNT_ID:role/fullstack-demo-pipeline-CodeBuildRole-*
      username: frontend-codebuild
    - groups:
      - system:masters
      rolearn: arn:aws:iam::$AWS_ACCOUNT_ID:role/fullstack-demo-backend-codebuild-role-v2
      username: backend-codebuild
kind: ConfigMap
metadata:
  name: aws-auth
  namespace: kube-system
EOF

kubectl apply -f aws-auth-config.yaml
```

---

## 📦 STEP 4: Source Code Deployment

### 4.1 Configure Git
```bash
# Configure git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 4.2 Get Repository URLs
```bash
# Get repository URLs from infrastructure outputs
FRONTEND_REPO=$(aws cloudformation describe-stacks --stack-name fullstack-demo-infrastructure --region eu-north-1 --query "Stacks[0].Outputs[?OutputKey=='FrontendCodeCommitCloneURL'].OutputValue" --output text)
BACKEND_REPO=$(aws cloudformation describe-stacks --stack-name fullstack-demo-infrastructure --region eu-north-1 --query "Stacks[0].Outputs[?OutputKey=='BackendCodeCommitCloneURL'].OutputValue" --output text)

echo "Frontend Repository: $FRONTEND_REPO"
echo "Backend Repository: $BACKEND_REPO"
```

### 4.3 Push Frontend Code
```bash
cd frontend

# Initialize git repository (if not already done)
git init
git branch -M main

# Set CodeCommit repository as origin
git remote add origin $FRONTEND_REPO
# Or if remote already exists:
# git remote set-url origin $FRONTEND_REPO

# Add and commit all files
git add .
git commit -m "Initial frontend deployment with SonarQube integration"

# Push to CodeCommit
git push -u origin main

# Verify push was successful
echo "✅ Frontend code pushed to CodeCommit"
```

### 4.4 Push Backend Code
```bash
cd ../backend

# Initialize git repository (if not already done)
git init
git branch -M main

# Set CodeCommit repository as origin
git remote add origin $BACKEND_REPO
# Or if remote already exists:
# git remote set-url origin $BACKEND_REPO

# Add and commit all files
git add .
git commit -m "Initial backend deployment with SonarQube integration"

# Push to CodeCommit
git push -u origin main

# Verify push was successful
echo "✅ Backend code pushed to CodeCommit"
```

### 4.5 Verify Code in AWS Console
```bash
# Check that code appears in CodeCommit repositories
echo "Verify in AWS Console:"
echo "1. Go to CodeCommit service"
echo "2. Check fullstack-demo-frontend-repo has files"
echo "3. Check fullstack-demo-backend-repo has files"
```

---

## 🔄 STEP 5: Pipeline Execution & Monitoring

### 5.1 Verify Pipeline Configuration
```bash
# Before triggering pipelines, verify SonarQube configuration
cd cloudformation
echo "Checking pipeline configuration..."
grep -A 2 -B 2 "sonar.host.url\|sonar.token" pipeline.yaml

# Ensure your SonarQube IP and token are correctly set
```

### 5.2 Trigger Pipelines
```bash
# Start frontend pipeline
echo "🚀 Starting frontend pipeline..."
aws codepipeline start-pipeline-execution --name fullstack-demo-frontend-pipeline --region eu-north-1

# Start backend pipeline
echo "🚀 Starting backend pipeline..."
aws codepipeline start-pipeline-execution --name fullstack-demo-backend-pipeline --region eu-north-1

echo "✅ Both pipelines triggered"
```

### 5.3 Monitor Pipeline Execution
```bash
# Check pipeline status (run every few minutes)
echo "=== PIPELINE STATUS ==="
echo "Frontend Pipeline:"
aws codepipeline get-pipeline-state --name fullstack-demo-frontend-pipeline --region eu-north-1 --query 'stageStates[].{Stage:stageName,Status:latestExecution.status}' --output table

echo -e "\nBackend Pipeline:"
aws codepipeline get-pipeline-state --name fullstack-demo-backend-pipeline --region eu-north-1 --query 'stageStates[].{Stage:stageName,Status:latestExecution.status}' --output table
```

### 5.4 Monitor Build Progress
```bash
# Watch build logs in real-time (optional)
echo "To monitor build logs:"
echo "1. Go to AWS CodeBuild console"
echo "2. Click on fullstack-demo-frontend-build or fullstack-demo-backend-build"
echo "3. View the latest build execution logs"

# Or check logs via CLI
aws logs describe-log-groups --log-group-name-prefix '/aws/codebuild/fullstack-demo' --region eu-north-1
```

### 5.5 Monitor EKS Deployments
```bash
# Check EKS deployments as pipelines complete
echo "=== EKS DEPLOYMENT STATUS ==="
kubectl get deployments,services,pods -o wide

# Watch pods come online
kubectl get pods -w
# Press Ctrl+C to stop watching
```

### 5.6 Get Application URLs
```bash
# Wait for LoadBalancers to get external IPs (may take 5-10 minutes)
echo "Waiting for LoadBalancer external IPs..."
kubectl get services -w
# Press Ctrl+C when both services have EXTERNAL-IP

# Get final URLs
FRONTEND_URL=$(kubectl get service frontend-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
BACKEND_URL=$(kubectl get service backend-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "🌐 Frontend URL: http://$FRONTEND_URL"
echo "🖥️ Backend URL: http://$BACKEND_URL"
```

---

## 🌐 STEP 6: Application Testing & Verification

### 6.1 Verify SonarQube Analysis
```bash
# Check that SonarQube analysis completed successfully
SONAR_IP="YOUR_EC2_PUBLIC_IP"  # Use your actual SonarQube IP

# Check projects via API
curl -s "http://$SONAR_IP:9000/api/projects/search" -u admin:Admin@123456 | jq '.components[] | {key: .key, name: .name, lastAnalysisDate: .lastAnalysisDate}'

# Or check in SonarQube web interface:
echo "🔍 Verify SonarQube Analysis:"
echo "1. Go to http://$SONAR_IP:9000"
echo "2. Login with admin/Admin@123456"
echo "3. Check both projects show recent analysis"
echo "4. Review code quality metrics"
```

### 6.2 Test Application Endpoints
```bash
# Test frontend accessibility
echo "🌐 Testing Frontend..."
curl -s "http://$FRONTEND_URL" | grep -o "<title>.*</title>"

# Test backend health endpoint
echo "🖥️ Testing Backend Health..."
curl -s "http://$BACKEND_URL/api/health"

# Test database connectivity
echo "🗄️ Testing Database Connection..."
curl -s "http://$BACKEND_URL/api/users"
```

### 6.3 Test Database Operations
```bash
# Create a test user
echo "➕ Creating test user..."
curl -X POST "http://$BACKEND_URL/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'

# Verify user was created
echo "📋 Verifying user creation..."
curl -s "http://$BACKEND_URL/api/users" | jq .

# Test user deletion (optional)
# curl -X DELETE "http://$BACKEND_URL/api/users/1"
```

### 6.4 Complete System Verification
```bash
echo "=== COMPLETE SYSTEM VERIFICATION ==="
echo "✅ Infrastructure: EKS + RDS + ECR + CodeCommit deployed"
echo "✅ SonarQube: Projects created and analyzed"
echo "✅ Pipelines: Both frontend and backend successful"
echo "✅ Applications: Frontend and backend accessible"
echo "✅ Database: MySQL operations working"
echo "✅ Load Balancing: External access configured"
echo ""
echo "🎉 Full-stack application deployment complete!"
echo "🌐 Frontend: http://$FRONTEND_URL"
echo "🖥️ Backend: http://$BACKEND_URL"
echo "🔍 SonarQube: http://$SONAR_IP:9000"
```

---

## 📊 Daily Operations & Maintenance

### Common Commands

#### Pipeline Management
```bash
# Check pipeline status
aws codepipeline get-pipeline-state --name fullstack-demo-frontend-pipeline --region eu-north-1
aws codepipeline get-pipeline-state --name fullstack-demo-backend-pipeline --region eu-north-1

# Restart failed pipeline
aws codepipeline start-pipeline-execution --name fullstack-demo-frontend-pipeline --region eu-north-1

# Check build logs
aws logs describe-log-groups --log-group-name-prefix '/aws/codebuild/fullstack-demo' --region eu-north-1
```

#### EKS Management
```bash
# Check application status
kubectl get deployments,services,pods -o wide

# Check pod logs
kubectl logs -l app=frontend --tail=50
kubectl logs -l app=backend --tail=50

# Scale application
kubectl scale deployment frontend --replicas=3
kubectl scale deployment backend --replicas=3

# Rolling restart
kubectl rollout restart deployment/frontend
kubectl rollout restart deployment/backend
```

#### Database Management
```bash
# Check database secret
kubectl get secret db-secret -o yaml

# Test database connection
kubectl run test-pod --rm -i --restart=Never --image=mysql:8.0 -- mysql -h $RDS_ENDPOINT -u admin -p
```

### Code Updates
```bash
# Update frontend
cd frontend
# Make your changes
git add . && git commit -m "Update frontend" && git push origin main

# Update backend
cd backend
# Make your changes
git add . && git commit -m "Update backend" && git push origin main

# Pipelines will automatically trigger and deploy changes
```

---

## 🚨 Troubleshooting

### Pipeline Issues
```bash
# Check specific build failure
BUILD_ID=$(aws codebuild list-builds-for-project --project-name fullstack-demo-frontend-build --region eu-north-1 --query 'ids[0]' --output text)
aws codebuild batch-get-builds --ids $BUILD_ID --region eu-north-1

# Check build logs
LOG_STREAM=$(aws logs describe-log-streams --log-group-name /aws/codebuild/fullstack-demo-frontend-build --region eu-north-1 --order-by LastEventTime --descending --max-items 1 --query 'logStreams[0].logStreamName' --output text)
aws logs get-log-events --log-group-name /aws/codebuild/fullstack-demo-frontend-build --log-stream-name $LOG_STREAM --region eu-north-1
```

### EKS Issues
```bash
# Check pod status
kubectl describe pods -l app=frontend
kubectl describe pods -l app=backend

# Check service endpoints
kubectl get endpoints

# Reconfigure kubectl
aws eks update-kubeconfig --region eu-north-1 --name fullstack-demo-eks-cluster

# Check aws-auth ConfigMap
kubectl get configmap aws-auth -n kube-system -o yaml
```

### Application Issues
```bash
# Check LoadBalancer status
kubectl describe service frontend-service
kubectl describe service backend-service

# Test internal connectivity
kubectl run test-pod --rm -i --restart=Never --image=curlimages/curl -- curl -s http://backend-service/api/health

# Check resource usage
kubectl top nodes
kubectl top pods
```

### SonarQube Issues
```bash
# Check SonarQube server status
curl -s "http://YOUR_SONAR_IP:9000/api/system/status"

# Check project analysis
curl -s "http://YOUR_SONAR_IP:9000/api/projects/search" -u admin:Admin@123456

# Restart SonarQube (if needed)
# SSH to EC2 instance and restart service
```

---

## 🧹 Cleanup & Resource Management

### Complete Resource Cleanup
```bash
# For comprehensive cleanup instructions, see the dedicated cleanup guide
cat CLEANUP-GUIDE.md

# Quick cleanup (WARNING: Deletes everything!)
aws cloudformation delete-stack --stack-name fullstack-demo-pipeline --region eu-north-1
aws cloudformation delete-stack --stack-name fullstack-demo-infrastructure --region eu-north-1

# Manual SonarQube cleanup
# Terminate SonarQube EC2 instance from AWS Console
```

**⚠️ Important**: For detailed cleanup instructions including proper sequence, troubleshooting, and verification, use the dedicated **[CLEANUP-GUIDE.md](CLEANUP-GUIDE.md)**.

### Partial Cleanup
```bash
# Delete only applications (keep infrastructure)
kubectl delete deployment frontend backend
kubectl delete service frontend-service backend-service

# Delete only pipeline (keep infrastructure)
aws cloudformation delete-stack --stack-name fullstack-demo-pipeline --region eu-north-1
```

---

## 📋 Deployment Checklist

### Pre-Deployment ✅
- [ ] AWS CLI configured with proper permissions
- [ ] kubectl installed
- [ ] Docker installed
- [ ] Git configured with user name and email

### Step 1: Infrastructure ✅
- [ ] Infrastructure stack deployed successfully
- [ ] EKS cluster running with 2+ nodes
- [ ] RDS database accessible
- [ ] ECR repositories created
- [ ] CodeCommit repositories created
- [ ] kubectl configured for EKS cluster

### Step 2: SonarQube Setup ✅
- [ ] SonarQube EC2 instance launched
- [ ] SonarQube accessible on port 9000
- [ ] Admin password changed to Admin@123456
- [ ] Frontend project created (fullstack-demo-frontend)
- [ ] Backend project created (fullstack-demo-backend)
- [ ] Authentication token generated
- [ ] SonarQube IP and token noted for pipeline deployment

### Step 3: Pipeline Deployment ✅
- [ ] Pipeline stack deployed successfully
- [ ] EKS authentication configured (aws-auth ConfigMap)
- [ ] CodeBuild roles have EKS access

### Step 4: Source Code ✅
- [ ] Git configured with user credentials
- [ ] Repository URLs obtained from infrastructure outputs
- [ ] Frontend code pushed to CodeCommit
- [ ] Backend code pushed to CodeCommit
- [ ] Code visible in AWS CodeCommit console

### Step 5: Pipeline Execution ✅
- [ ] SonarQube configuration verified in pipeline.yaml
- [ ] Frontend pipeline triggered and successful
- [ ] Backend pipeline triggered and successful
- [ ] SonarQube analysis completed for both projects
- [ ] Docker images pushed to ECR
- [ ] Applications deployed to EKS

### Step 6: Application Verification ✅
- [ ] Frontend pods running (2/2)
- [ ] Backend pods running (2/2)
- [ ] LoadBalancer services have external IPs
- [ ] Frontend accessible via browser
- [ ] Backend API responding (/api/health)
- [ ] Database connectivity working (/api/users)
- [ ] SonarQube projects show recent analysis
- [ ] Complete end-to-end functionality verified

---

## 🎯 Architecture Overview

```
Internet → AWS LoadBalancer → Frontend (React) → Backend (Node.js) → RDS MySQL
                                    ↓
                            SonarQube Analysis
                                    ↓
                    CodeCommit → CodePipeline → CodeBuild → ECR → EKS
```

### Technology Stack
- **Frontend**: React 18 + TypeScript + Nginx
- **Backend**: Node.js + Express + MySQL
- **Infrastructure**: AWS EKS + RDS + ECR + CodeCommit
- **CI/CD**: CodePipeline + CodeBuild + SonarQube
- **Orchestration**: Kubernetes with LoadBalancer

### Key Features
- **High Availability**: 2 replicas per service
- **Auto Scaling**: Kubernetes HPA
- **Zero Downtime**: Rolling deployments
- **Code Quality**: SonarQube analysis
- **Security**: VPC, security groups, secrets
- **Monitoring**: CloudWatch logs and metrics

---

## 📞 Support & Maintenance

### Regular Tasks
- Monitor pipeline executions
- Check application health endpoints
- Review SonarQube analysis reports
- Update dependencies regularly
- Monitor resource usage and costs

### Emergency Procedures
- Pipeline failures: Check CodeBuild logs
- Application down: Check pod status and logs
- Database issues: Verify RDS status and connectivity
- High resource usage: Scale deployments

### Contact Information
- AWS Console: Monitor CloudFormation, EKS, RDS
- SonarQube: http://YOUR_SONAR_IP:9000
- Application: Frontend and Backend LoadBalancer URLs

---

**🎉 Your enterprise-grade full-stack application with CI/CD pipeline is now complete and ready for production use!**
