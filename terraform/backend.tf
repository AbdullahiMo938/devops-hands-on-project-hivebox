terraform {
  backend "s3" {
    bucket         = "hivebox-terraform-state"
    key            = "terraform.tfstate"
    region         = "eu-west-2"

    dynamodb_table = "hivebox-terraform-locks"

    encrypt        = true
  }
}