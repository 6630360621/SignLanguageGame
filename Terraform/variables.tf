variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "alb_certificate_arn" {
  description = "ACM certificate ARN used by the ALB HTTPS listener"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "image_uri" {
  description = "Full container image URI to deploy"
  type        = string
}
variable "amplify_app_name" {
  description = "AWS Amplify app name for the frontend"
  default     = "deaf-lingo-frontend"
}
variable "amplify_project_name" {
  description = "Project name prefix for AWS resources"
  type        = string
}
variable "amplify_repository" {
  description = "Git repository URL for Amplify hosting"
  type        = string
}
variable "amplify_instance_type" {
  description = "EC2 instance type for frontend hosting"
  type        = string
}
variable "amplify_access_token" {
  description = "GitHub personal access token for Amplify to access the repository"
  type        = string
  default     = null
  sensitive   = true
}

variable "amplify_access_token_secret_name" {
  description = "Secrets Manager secret name or ARN containing the Amplify Git access token"
  type        = string
  default     = null
}
variable "amplify_branch_name" {
    description = "Git branch Amplify should deploy"
    type        = string
    default     = "main"
  }

  variable "amplify_app_root" {
    description = "Monorepo path to the frontend app root"
    type        = string
    default     = "frontend"
  }

variable "frontend_existing_key_name" {
  description = "Existing EC2 key pair name for SSH. Leave empty to skip key pair attachment unless frontend_ssh_public_key is provided"
  type        = bool
  default     = false
}

variable "frontend_auto_deploy_on_boot" {
  description = "Attempt an artifact deploy during EC2 boot"
  type        = bool
  default     = false
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