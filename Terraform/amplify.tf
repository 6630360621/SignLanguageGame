locals {
  amplify_frontend_url = "https://${aws_amplify_branch.frontend.branch_name}.${aws_amplify_app.frontend.id}.amplifyapp.com"

  amplify_access_token_effective = (
    var.amplify_access_token != null && trimspace(var.amplify_access_token) != ""
    ? var.amplify_access_token
    : try(data.aws_secretsmanager_secret_version.amplify_access_token[0].secret_string, null)
  )
}

data "aws_secretsmanager_secret_version" "amplify_access_token" {
  count     = var.amplify_access_token_secret_name != null && trimspace(var.amplify_access_token_secret_name) != "" ? 1 : 0
  secret_id = var.amplify_access_token_secret_name
}

resource "aws_amplify_app" "frontend" {
  name         = var.amplify_app_name
  repository   = var.amplify_repository
  access_token = local.amplify_access_token_effective
  platform     = "WEB"

  environment_variables = {
    VITE_COGNITO_REGION = var.aws_region
    VITE_USER_POOL_ID    = aws_cognito_user_pool.frontend_users.id
    VITE_APP_CLIENT_ID   = aws_cognito_user_pool_client.frontend_app.id
    VITE_API_BASE_URL    = "https://${aws_lb.app.dns_name}"
  }

  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>"
    status = "200"
    target = "/index.html"
  }
}

resource "aws_amplify_branch" "frontend" {
  app_id            = aws_amplify_app.frontend.id
  branch_name       = var.amplify_branch_name
  framework         = "React"
  stage             = "PRODUCTION"
  enable_auto_build = true
}