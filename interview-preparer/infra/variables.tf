# =========================================================================
# AI Tech Interview - Terraform Variables
# =========================================================================

variable "subscription_id" {
  description = "The Azure subscription ID to deploy resources into"
  type        = string
}

variable "project_name" {
  description = "The name of the project, used for resource naming. Must be 2-20 chars, lowercase alphanumerics and hyphens, start/end with letter."
  type        = string
  default     = "ai-interview"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,18}[a-z0-9]$", var.project_name)) && length(var.project_name) >= 2 && length(var.project_name) <= 20
    error_message = "Project name must be 2-20 lowercase characters, start with a letter, end with alphanumeric, and contain only letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "The environment (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

variable "location" {
  description = "The primary Azure region for resources. Using southcentralus (Central US lacks gpt-4o-mini availability)"
  type        = string
  default     = "southcentralus"
}

variable "openai_location" {
  description = <<-EOT
    The Azure region for OpenAI resources (may differ due to availability).
    Regions with gpt-4o-mini: eastus, eastus2, northcentralus, southcentralus, westus, westus3, swedencentral
    Note: centralus does NOT have gpt-4o-mini available.
  EOT
  type        = string
  default     = "southcentralus"
}

variable "openai_deployment_name" {
  description = "The name for the OpenAI model deployment. Must be 2-64 chars, alphanumerics and hyphens."
  type        = string
  default     = "gpt-4o-mini"

  validation {
    condition     = can(regex("^[a-zA-Z0-9][a-zA-Z0-9-]{0,62}[a-zA-Z0-9]$|^[a-zA-Z0-9]{1,2}$", var.openai_deployment_name)) && length(var.openai_deployment_name) >= 1 && length(var.openai_deployment_name) <= 64
    error_message = "Deployment name must be 1-64 characters, alphanumerics and hyphens, start and end with alphanumeric."
  }
}

variable "openai_capacity" {
  description = "The capacity (tokens per minute in thousands) for OpenAI deployment. Default quota for gpt-4o-mini is 450K TPM."
  type        = number
  default     = 30 # 30K TPM - sufficient for MVP (~3K requests/min)

  validation {
    condition     = var.openai_capacity >= 1 && var.openai_capacity <= 450
    error_message = "OpenAI capacity must be between 1 and 450 (default quota limit for gpt-4o-mini)"
  }
}

variable "speech_sku" {
  description = <<-EOT
    The SKU for Azure Speech Service:
    - F0 (Free): 5 hours TTS, 5 hours STT per month - development/testing only
    - S0 (Standard): Pay-as-you-go, unlimited usage - cheapest non-free option
      Pricing: ~$4/1M characters TTS, ~$1/hour STT (real-time)
    S0 is recommended as the cheapest non-free SKU with production features.
  EOT
  type        = string
  default     = "S0" # Cheapest non-free SKU, pay-as-you-go

  validation {
    condition     = contains(["F0", "S0"], var.speech_sku)
    error_message = "Speech SKU must be F0 (Free) or S0 (Standard)"
  }
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
