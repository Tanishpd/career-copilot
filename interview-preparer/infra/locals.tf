# =========================================================================
# AI Tech Interview - Local Values
# =========================================================================

locals {
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Purpose     = "AI Tech Interview Preparation Platform"
    },
    var.tags
  )
}
