variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "checkmybenefits.uk"
}

variable "bucket_name" {
  description = "S3 bucket name for the website"
  type        = string
  default     = "checkmybenefits-website"
}
