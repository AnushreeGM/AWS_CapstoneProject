# 📘 Enabling Container Insights on Amazon EKS

## 🧹 Overview

Amazon CloudWatch Container Insights helps monitor, troubleshoot, and alert on containerized applications in EKS. This document provides step-by-step instructions for enabling Container Insights on the EKS cluster `fullstack-demo-eks-cluster` in the `eu-north-1` region.

---

## 🛠️ Prerequisites

* AWS CLI, `eksctl`, and `kubectl` installed
* Proper AWS credentials configured
* IAM permissions for managing IAM roles and CloudWatch
* Cluster: `fullstack-demo-eks-cluster`
* Region: `eu-north-1`

---

## ✅ Step 1: Set AWS Region (if not configured)

```bash
export AWS_REGION=eu-north-1
```

---

## ✅ Step 2: Get NodeGroup IAM Role

### 2.1 Identify NodeGroup

```bash
aws eks list-nodegroups \
  --cluster-name fullstack-demo-eks-cluster \
  --region eu-north-1
```

Expected output:

```json
{
  "nodegroups": ["fullstack-demo-nodegroup"]
}
```

### 2.2 Get IAM Role Name

```bash
ROLE_NAME=$(aws eks describe-nodegroup \
  --cluster-name fullstack-demo-eks-cluster \
  --nodegroup-name fullstack-demo-nodegroup \
  --region eu-north-1 \
  --query "nodegroup.nodeRole" \
  --output text | awk -F'/' '{print $NF}')

echo "Node Role: $ROLE_NAME"
```

---

## ✅ Step 3: Attach CloudWatchAgent Policy

```bash
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
```

### Verify Attachment

```bash
aws iam list-attached-role-policies \
  --role-name $ROLE_NAME
```

---


### 4.2 Apply to Cluster

```bash
kubectl apply -f container-insights-daemonset.yaml
```

This deploys:

* CloudWatch Agent (metrics)
* FluentD (logs)
* ConfigMaps, RBAC, and namespace

---

## ✅ Step 5: Verify DaemonSets

```bash
kubectl -n amazon-cloudwatch get daemonsets
```

Expected:

```
NAME                 DESIRED   CURRENT   READY
cloudwatch-agent     2         2         2
fluentd-cloudwatch   2         2         2
```

---

## ✅ Step 6: Check CloudWatch Console

Navigate to:

* **CloudWatch > Container Insights > Performance Monitoring**, or
* **Log groups**:

  ```
  /aws/containerinsights/fullstack-demo-eks-cluster/application
  /aws/containerinsights/fullstack-demo-eks-cluster/performance
  ```

---

## 📌 Notes

* Logs and metrics may take a few minutes to appear.
* Ensure worker nodes have internet access.
* Consider setting log retention policies for cost control.

---

*End of Document*

