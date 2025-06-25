# Variables

variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "fullstack-demo"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-north-1"
}

variable "allowed_cidr" {
  description = "CIDR block allowed to access SonarQube (restrict for security)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "db_username" {
  description = "RDS MySQL master username"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "RDS MySQL master password (minimum 8 characters)"
  type        = string
  sensitive   = true
}
