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

variable "alert_email" {
  description = "Email address for cost and usage alerts"
  type        = string
  default     = "alfied@gmail.com"
}

variable "monthly_budget" {
  description = "Monthly budget limit in USD for Bedrock spend"
  type        = string
  default     = "50"
}

variable "missing_benefit_api_key" {
  description = "API key for MissingBenefit MCP API"
  type        = string
  sensitive   = true
}
