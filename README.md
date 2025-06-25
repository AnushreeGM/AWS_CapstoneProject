# AWS Capstone Project – 3-Tier Application Deployment

This project demonstrates a complete CI/CD pipeline deployment of a **3-tier web application** using **CloudFormation** and **Terraform** in different AWS regions. The application is deployed into an **Amazon EKS cluster** with Docker containers managed via **ECR**, and monitored using **CloudWatch Container Insights**.

![image](https://github.com/user-attachments/assets/fee8db16-f222-4bc9-95f4-39755c256bfe)


## 🔧 Key Components

- **3-Tier Architecture** (Frontend, Backend, MySQL Database)
- **Infrastructure as Code** using:
  - **AWS CloudFormation** in one region
  - **Terraform** in another region
- **Amazon EKS** for container orchestration
- **AWS CodePipeline**, **CodeBuild**, and **CodeDeploy** for CI/CD
- **Amazon ECR** for container image storage
- **SonarQube** for static code analysis
- **Amazon CloudWatch** for monitoring

## 📁 Project Structure

| Folder / File | Description |
|---------------|-------------|
| `cloudformation/README.md` | Pipeline setup using CloudFormation |
| `DEPLOYMENT-GUIDE.md` | Step-by-step guide for CloudFormation-based infrastructure deployment |
| `Kubernetes_Container_Insights.json` | CloudWatch Container Insights configuration |
| `terraform/` | Terraform scripts to deploy infrastructure in a different region |
| `ecr/` | Docker image build and push to ECR |
| `eks/` | Kubernetes manifests for application deployment |

## 🚀 Getting Started

Please refer to the detailed guides in the respective directories:

- **CloudFormation Deployment Guide:**  
  [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)

- **CI/CD Pipeline Setup:**  
  [cloudformation/README.md](./cloudformation/README.md)

- **Monitoring Setup:**  
  [Kubernetes_Container_Insights.json](./Kubernetes_Container_Insights.json)

---

