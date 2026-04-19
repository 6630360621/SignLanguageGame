resource "aws_security_group" "rds_sg" {
  name        = "leaderboard-db-sg"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 5432 # Default for Postgres. Use 3306 for MySQL.
    to_port         = 5432
    protocol        = "tcp"
    # This is the "Handshake": only allows the ECS security group
    security_groups = [aws_security_group.ecs_sg.id] 
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_subnet_group" "db_subnets" {
  name       = "main-db-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  tags = { Name = "My DB Subnet Group" }
}

resource "aws_db_instance" "database" {
  identifier           = "leaderboard-db"
  allocated_storage    = 20
  engine               = "postgres"
  instance_class       = "db.t3.micro" # Smallest/Cheapest for testing
  
  db_name              = "leaderboard"
  username             = "dbadmin"
  password             = var.db_password # Set this in variables.tf

  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  
  publicly_accessible  = false
  skip_final_snapshot  = true 
}