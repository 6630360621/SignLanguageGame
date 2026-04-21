resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/leaderboard-backend"
  retention_in_days = 7
}

resource "aws_security_group" "alb_sg" {
  name   = "leaderboard-alb-sg"
  vpc_id = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_sg" {
  name   = "leaderboard-ecs-sg"
  vpc_id = data.aws_vpc.default.id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "app" {
  name               = "leaderboard-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = data.aws_subnets.default.ids
}

resource "aws_lb_target_group" "app" {
  name        = "leaderboard-tg"
  port        = 8000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = data.aws_vpc.default.id

  health_check {
    path                = "/docs"
    matcher             = "200-399"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_apigatewayv2_api" "backend" {
  name          = "leaderboard-backend-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = false
    allow_headers      = ["*"]
    allow_methods      = ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"]
    allow_origins      = ["https://amplify.dx9aauqpvr73q.amplifyapp.com", "http://localhost:5173"]
  }
}

resource "aws_apigatewayv2_integration" "backend_proxy" {
  api_id                 = aws_apigatewayv2_api.backend.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "ANY"
  payload_format_version = "1.0"
  integration_uri        = "http://${aws_lb.app.dns_name}/{proxy}"
}

resource "aws_apigatewayv2_route" "backend_proxy" {
  api_id    = aws_apigatewayv2_api.backend.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.backend_proxy.id}"
}

resource "aws_apigatewayv2_stage" "backend" {
  api_id      = aws_apigatewayv2_api.backend.id
  name        = "$default"
  auto_deploy = true
}

# The "Server"
resource "aws_ecs_cluster" "main" {
  name = "leaderboard-cluster"
}

# The "Blueprint"
resource "aws_ecs_task_definition" "app_task" {
  family                   = "backend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = var.image_uri
      essential = true
      portMappings = [{ containerPort = 8000, hostPort = 8000 }]
      # Database connection details passed as Env Vars
      environment = [
        { name = "DB_ENGINE", value = "postgres" },
        { name = "DB_HOST", value = aws_db_instance.database.address },
        { name = "DB_PORT", value = "5432" },
        { name = "DB_NAME", value = aws_db_instance.database.db_name },
        { name = "DB_USER", value = aws_db_instance.database.username },
        { name = "DB_PASSWORD", value = var.db_password },
        { name = "DB_SSLMODE", value = "require" },
        { name = "COGNITO_REGION", value = var.aws_region },
        { name = "USER_POOL_ID", value = aws_cognito_user_pool.frontend_users.id },
        { name = "APP_CLIENT_ID", value = aws_cognito_user_pool_client.frontend_app.id },
        { name = "ALLOW_MOCK_AUTH", value = "false" }
      ],
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# The "Manager"
resource "aws_ecs_service" "app_service" {
  name            = "backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  health_check_grace_period_seconds = 300

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "backend"
    container_port   = 8000
  }

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    assign_public_ip = true
    security_groups  = [aws_security_group.ecs_sg.id]
  }

  depends_on = [aws_lb_listener.http]
}