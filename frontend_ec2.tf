data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_iam_role" "frontend_ec2_role" {
  name = "${var.project_name}-frontend-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "frontend_ssm_policy" {
  role       = aws_iam_role.frontend_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "frontend_instance_profile" {
  name = "${var.project_name}-frontend-instance-profile"
  role = aws_iam_role.frontend_ec2_role.name
}

resource "aws_security_group" "frontend_ec2_sg" {
  name   = "${var.project_name}-frontend-ec2-sg"
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

  dynamic "ingress" {
    for_each = var.frontend_enable_ssh ? [1] : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [var.frontend_ssh_cidr]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_key_pair" "frontend" {
  count      = var.frontend_ssh_public_key != "" ? 1 : 0
  key_name   = "${var.project_name}-frontend-key"
  public_key = var.frontend_ssh_public_key
}

locals {
  frontend_key_name = var.frontend_existing_key_name != "" ? var.frontend_existing_key_name : (
    length(aws_key_pair.frontend) > 0 ? aws_key_pair.frontend[0].key_name : null
  )
}

resource "aws_instance" "frontend" {
  ami                         = data.aws_ami.amazon_linux_2023.id
  instance_type               = var.frontend_instance_type
  subnet_id                   = data.aws_subnets.default.ids[0]
  vpc_security_group_ids      = [aws_security_group.frontend_ec2_sg.id]
  iam_instance_profile        = aws_iam_instance_profile.frontend_instance_profile.name
  associate_public_ip_address = true
  key_name                    = local.frontend_key_name

  user_data = <<-EOF
              #!/bin/bash
              set -euxo pipefail
              dnf update -y
              dnf install -y nginx
              systemctl enable nginx
              cat > /usr/share/nginx/html/index.html << 'HTML'
              <!doctype html>
              <html>
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>Frontend Server Ready</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 2rem; }
                  </style>
                </head>
                <body>
                  <h1>Frontend EC2 is ready</h1>
                  <p>Deploy your built Vite files to /usr/share/nginx/html.</p>
                </body>
              </html>
              HTML
              systemctl restart nginx
              EOF

  tags = {
    Name = "${var.project_name}-frontend"
  }
}
