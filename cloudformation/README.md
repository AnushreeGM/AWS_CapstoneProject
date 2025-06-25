# CloudFormation Templates

This directory contains the CloudFormation templates for the full-stack application CI/CD pipeline.

## Active Files

### `pipeline.yaml`
**Main CI/CD Pipeline Template**
- Complete frontend and backend pipelines
- SonarQube integration with your configuration
- EKS deployment with LoadBalancer services
- RDS MySQL database integration
- ECR container registry

**Features:**
- Frontend: React build without testing, SonarQube analysis, EKS deployment
- Backend: Node.js with testing, SonarQube analysis, EKS deployment
- Database: RDS MySQL connection with secrets management
- Load Balancing: External access via AWS LoadBalancer

### `setup-sonarqube.sh`
**SonarQube Setup Script**
- Installs SonarQube server on EC2
- Configures admin credentials
- Sets up projects for frontend and backend

## Deployment Commands

### Deploy Infrastructure + Pipeline
```bash
# Deploy the complete pipeline
aws cloudformation deploy \
  --template-file pipeline.yaml \
  --stack-name fullstack-demo-pipeline \
  --parameter-overrides \
    ProjectName="fullstack-demo" \
    RDSEndpoint="your-rds-endpoint" \
    AWSAccountId="your-account-id" \
    SonarQubeHostURL="http://your-sonarqube-ip:9000" \
    SonarQubeToken="your-sonarqube-token" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-north-1
```

### Example with Real Values
```bash
# Example deployment with actual values
aws cloudformation deploy \
  --template-file pipeline.yaml \
  --stack-name fullstack-demo-pipeline \
  --parameter-overrides \
    ProjectName="fullstack-demo" \
    RDSEndpoint="fullstack-demo-db.abc123.eu-north-1.rds.amazonaws.com" \
    AWSAccountId="545009829015" \
    SonarQubeHostURL="http://13.51.161.9:9000" \
    SonarQubeToken="squ_a8096a6e1c7cda5b7ce12d279f0444de74ee50f1" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-north-1
```

### Trigger Pipelines
```bash
# Frontend pipeline
aws codepipeline start-pipeline-execution --name fullstack-demo-frontend-pipeline --region eu-north-1

# Backend pipeline
aws codepipeline start-pipeline-execution --name fullstack-demo-backend-pipeline --region eu-north-1
```

## SonarQube Configuration

The pipeline uses your exact SonarQube configuration:
- **Host**: http://13.51.161.9
- **Token**: squ_a8096a6e1c7cda5b7ce12d279f0444de74ee50f1
- **Scanner Version**: 7.0.2.4839
- **Projects**: fullstack-demo-frontend, fullstack-demo-backend

## Application URLs

After deployment, access your application at:
- **Frontend**: http://abe21695d7ed44d1faaec8cf89cba82e-265517136.eu-north-1.elb.amazonaws.com
- **Backend**: http://ac4a09d0aa27548a2983bd7e6deac691-275729803.eu-north-1.elb.amazonaws.com
- **SonarQube**: http://13.51.161.9 (admin/Admin@123456)

## Backup

All previous iterations and experimental templates are stored in the `backup/` directory.
