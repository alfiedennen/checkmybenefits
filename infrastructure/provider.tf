terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "stoppedclocks-terraform-state"
    key            = "checkmybenefits/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "stoppedclocks-terraform-locks"
    encrypt        = true
  }
}

# Default provider — eu-west-2 (London) for all UK-hosted resources
provider "aws" {
  region = "eu-west-2"

  default_tags {
    tags = {
      Project   = "CheckMyBenefits"
      ManagedBy = "Terraform"
    }
  }
}

# us-east-1 provider — required for ACM certificates used by CloudFront
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "CheckMyBenefits"
      ManagedBy = "Terraform"
    }
  }
}
