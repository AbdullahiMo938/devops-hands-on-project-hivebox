module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.30"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnets

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  eks_managed_node_groups = {
    main = {
      subnet_ids = module.vpc.public_subnets

      instance_types = ["t3.small"]

      min_size     = 1
      max_size     = 1
      desired_size = 1

      # CRITICAL FIX
      enable_public_ip = true
    }
  }

  enable_cluster_creator_admin_permissions = true
}