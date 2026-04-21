output "api_endpoint" {
  description = "Backend API URL through API Gateway"
  value       = aws_apigatewayv2_stage.backend.invoke_url
}

output "rds_endpoint" {
  description = "RDS endpoint used by ECS tasks"
  value       = aws_db_instance.database.address
}

output "frontend_url" {
  description = "Amplify hosted frontend URL"
  value       = local.amplify_frontend_url
}

output "amplify_app_id" {
  description = "Amplify app ID"
  value       = aws_amplify_app.frontend.id
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.frontend_users.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito App Client ID for frontend"
  value       = aws_cognito_user_pool_client.frontend_app.id
}

output "cognito_hosted_ui_base" {
  description = "Cognito Hosted UI base domain"
  value       = "https://${aws_cognito_user_pool_domain.frontend_domain.domain}.auth.${var.aws_region}.amazoncognito.com"
}
