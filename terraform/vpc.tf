module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "hivebox-vpc-london"
  cidr = "10.0.0.0/16"

  azs = ["eu-west-2a", "eu-west-2b"]

  
  public_subnets = [
    "10.0.101.0/24",
    "10.0.102.0/24"
  ]

  
  enable_nat_gateway = false

  # Required for EKS nodes to get public IPs
  map_public_ip_on_launch = true


  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
    "kubernetes.io/cluster/hivebox-london-cluster" = "shared"
  }

  tags = {
    Environment = "dev"
    Project     = "hivebox"
  }
}