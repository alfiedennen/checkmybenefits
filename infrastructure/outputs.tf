output "nameservers" {
  description = "Update your domain registrar with these nameservers"
  value       = aws_route53_zone.main.name_servers
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (needed for GitHub Actions)"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "s3_bucket" {
  description = "S3 bucket name for deployments"
  value       = aws_s3_bucket.website.id
}

output "api_gateway_url" {
  description = "API Gateway URL for chat API"
  value       = aws_api_gateway_stage.prod.invoke_url
}

output "guardrail_id" {
  description = "Bedrock Guardrail ID for chat API"
  value       = aws_bedrock_guardrail.chat.guardrail_id
}
