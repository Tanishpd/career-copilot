# =========================================================================
# AI Tech Interview - Terraform Outputs
# These outputs can be used to populate your .env.local file
# =========================================================================

output "resource_group_name" {
  description = "The name of the resource group"
  value       = azurerm_resource_group.main.name
}

# =========================================================================
# Azure OpenAI Outputs
# =========================================================================
output "openai_endpoint" {
  description = "The endpoint URL for Azure OpenAI"
  value       = azurerm_cognitive_account.openai.endpoint
}

output "openai_primary_key" {
  description = "The primary access key for Azure OpenAI"
  value       = azurerm_cognitive_account.openai.primary_access_key
  sensitive   = true
}

output "openai_deployment_name" {
  description = "The name of the OpenAI model deployment"
  value       = azurerm_cognitive_deployment.gpt4o_mini.name
}

output "openai_resource_name" {
  description = "The name of the Azure OpenAI resource"
  value       = azurerm_cognitive_account.openai.name
}

# =========================================================================
# Azure Speech Service Outputs
# =========================================================================
output "speech_key" {
  description = "The primary access key for Azure Speech Service"
  value       = azurerm_cognitive_account.speech.primary_access_key
  sensitive   = true
}

output "speech_region" {
  description = "The region of the Azure Speech Service"
  value       = azurerm_cognitive_account.speech.location
}

output "speech_endpoint" {
  description = "The endpoint URL for Azure Speech Service"
  value       = azurerm_cognitive_account.speech.endpoint
}

output "speech_resource_name" {
  description = "The name of the Azure Speech Service resource"
  value       = azurerm_cognitive_account.speech.name
}

# =========================================================================
# Environment Variables Output
# Run: terraform output -raw env_file_content > ../.env.local
# =========================================================================
output "env_file_content" {
  description = "Content for .env.local file (run: terraform output -raw env_file_content > ../.env.local)"
  value       = <<-EOT
    # Azure OpenAI Configuration
    AZURE_OPENAI_ENDPOINT=${azurerm_cognitive_account.openai.endpoint}
    AZURE_OPENAI_API_KEY=${azurerm_cognitive_account.openai.primary_access_key}
    AZURE_OPENAI_DEPLOYMENT=${azurerm_cognitive_deployment.gpt4o_mini.name}
    AZURE_OPENAI_API_VERSION=2024-10-21

    # Azure Speech Service Configuration
    AZURE_SPEECH_KEY=${azurerm_cognitive_account.speech.primary_access_key}
    AZURE_SPEECH_REGION=${azurerm_cognitive_account.speech.location}
  EOT
  sensitive   = true
}
