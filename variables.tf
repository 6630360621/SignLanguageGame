variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "image_uri" {
  description = "Full container image URI to deploy"
  type        = string
  default     = "699938055022.dkr.ecr.us-east-1.amazonaws.com/my-leaderboard-backend:latest"
}

variable "project_name" {
  description = "Project name prefix for AWS resources"
  type        = string
  default     = "leaderboard"
}

variable "frontend_instance_type" {
  description = "EC2 instance type for frontend hosting"
  type        = string
  default     = "t3.micro"
}

variable "frontend_ssh_cidr" {
  description = "CIDR allowed to SSH into the frontend EC2 instance"
  type        = string
  default     = "0.0.0.0/0"
}

variable "frontend_enable_ssh" {
  description = "Whether to allow SSH (22) to frontend EC2"
  type        = bool
  default     = true
}

variable "frontend_existing_key_name" {
  description = "Existing EC2 key pair name for SSH. Leave empty to skip key pair attachment unless frontend_ssh_public_key is provided"
  type        = string
  default     = ""
}

variable "frontend_ssh_public_key" {
  description = "Optional SSH public key material to create a new EC2 key pair"
  type        = string
  default     = ""
}

variable "cognito_user_pool_name" {
  description = "Cognito User Pool name"
  type        = string
  default     = "deaf-lingo-users"
}

variable "cognito_domain_prefix" {
  description = "Unique prefix for Cognito Hosted UI domain (must be globally unique per region)"
  type        = string
}

variable "cognito_callback_urls" {
  description = "Allowed callback URLs for Cognito app client"
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "cognito_logout_urls" {
  description = "Allowed logout URLs for Cognito app client"
  type        = list(string)
  default     = ["http://localhost:5173"]
}