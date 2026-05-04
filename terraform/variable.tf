variable "region" {
  description = "AWS Region"
  default     = "eu-west-2"
}

variable "cluster_name" {
  description = "EKS Cluster Name"
  default     = "hivebox-london-cluster"
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
}