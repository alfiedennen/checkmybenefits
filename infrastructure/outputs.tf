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

output "lambda_function_url" {
  description = "Lambda function URL for chat API"
  value       = aws_lambda_function_url.chat.function_url
}
