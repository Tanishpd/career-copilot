# =========================================================================
# AI Tech Interview - Azure Infrastructure
# Terraform configuration for provisioning Azure OpenAI and Speech Services
#
# Version constraints are defined in versions.tf following Azure Verified
# Modules (AVM) specifications:
# - TFNFR25: Terraform CLI ~> 1.9
# - TFFR3: AzureRM provider ~> 4.0
# =========================================================================

# -----------------------------------------------------------------------------
# Provider Configuration
# -----------------------------------------------------------------------------
provider "azurerm" {
  features {
    cognitive_account {
      # Automatically purge soft-deleted accounts on destroy
      # Set to false in production to allow recovery
      purge_soft_delete_on_destroy = true
    }
  }

  subscription_id = var.subscription_id
}

# -----------------------------------------------------------------------------
# Random Suffix Generator
# Ensures globally unique resource names for Azure Cognitive Services
# -----------------------------------------------------------------------------
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# -----------------------------------------------------------------------------
# Resource Group
# Central container for all project resources
# -----------------------------------------------------------------------------
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location

  tags = local.common_tags

  lifecycle {
    # Prevent accidental deletion of resource group containing all resources
    prevent_destroy = false # Set to true in production
  }
}

# -----------------------------------------------------------------------------
# Azure OpenAI Service
# Provides access to GPT-4o-mini for interview question generation and
# response evaluation. Uses Cognitive Services API.
# Reference: https://learn.microsoft.com/en-us/azure/ai-services/openai/
# -----------------------------------------------------------------------------
resource "azurerm_cognitive_account" "openai" {
  name                  = "${var.project_name}-openai-${random_string.suffix.result}"
  location              = var.openai_location # gpt-4o-mini available in: southcentralus, eastus, westus, etc.
  resource_group_name   = azurerm_resource_group.main.name
  kind                  = "OpenAI"
  sku_name              = "S0" # Only SKU available for Azure OpenAI (pay-as-you-go per token)
  custom_subdomain_name = "${var.project_name}-openai-${random_string.suffix.result}"

  # Network access configuration
  # TODO: Set to false and configure private endpoints for production
  public_network_access_enabled = true

  # Managed identity for secure resource access
  identity {
    type = "SystemAssigned"
  }

  tags = local.common_tags

  lifecycle {
    # Prevent accidental deletion of OpenAI resource
    prevent_destroy = false # Set to true in production
  }
}

# -----------------------------------------------------------------------------
# Azure OpenAI Model Deployment - GPT-4o-mini
# Deploys the GPT-4o-mini model for interview operations:
# - Question generation based on role and job description
# - Response evaluation with structured scoring
# Reference: https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models
# -----------------------------------------------------------------------------
resource "azurerm_cognitive_deployment" "gpt4o_mini" {
  name                 = var.openai_deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "gpt-4o-mini"
    version = "2024-07-18" # Stable version with JSON mode support
  }

  # SKU configuration for token quota
  # Standard deployment: capacity = tokens per minute (TPM) in thousands
  # Default quota for gpt-4o-mini: 450K TPM (can request increase)
  sku {
    name     = "Standard"
    capacity = var.openai_capacity
  }

  # Optional: Enable dynamic throttling for better rate limit handling
  # dynamic_throttling_enabled = true

  lifecycle {
    # Allow model version updates without forcing recreation
    ignore_changes = [model[0].version]
  }
}

# -----------------------------------------------------------------------------
# Azure Speech Service
# Provides Text-to-Speech (TTS) and Speech-to-Text (STT) capabilities:
# - TTS: Reads interview questions aloud to candidates
# - STT: Transcribes spoken responses in real-time
# Reference: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/
# -----------------------------------------------------------------------------
resource "azurerm_cognitive_account" "speech" {
  name                = "${var.project_name}-speech-${random_string.suffix.result}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  kind                = "SpeechServices"
  sku_name            = var.speech_sku # F0 = Free tier, S0 = Standard

  # Network access configuration
  # TODO: Set to false and configure private endpoints for production
  public_network_access_enabled = true

  # Managed identity for secure resource access
  identity {
    type = "SystemAssigned"
  }

  tags = local.common_tags

  lifecycle {
    # Prevent accidental deletion of Speech resource
    prevent_destroy = false # Set to true in production
  }
}
