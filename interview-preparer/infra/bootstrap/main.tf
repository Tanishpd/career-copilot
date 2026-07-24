# =========================================================================
# AI Tech Interview - Terraform State Storage Bootstrap
#
# This configuration creates the Azure Storage Account for storing
# Terraform remote state. Run this ONCE before using the main infra.
#
# Best Practices (Microsoft Learn):
# - Storage account names: 3-24 lowercase letters and numbers only
# - Container names: 3-63 lowercase letters, numbers, and hyphens
# - Use Microsoft Entra ID authentication (more secure than access keys)
# - Enable blob versioning for state recovery
# - Restrict network access in production
#
# Reference: https://learn.microsoft.com/en-us/azure/developer/terraform/store-state-in-azure-storage
# =========================================================================

terraform {
  required_version = "~> 1.9"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------
variable "subscription_id" {
  description = "The Azure subscription ID"
  type        = string
}

variable "location" {
  description = "Azure region for the state storage"
  type        = string
  default     = "southcentralus"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "ai-interview"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# -----------------------------------------------------------------------------
# Random suffix for globally unique storage account name
# -----------------------------------------------------------------------------
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
  numeric = true
}

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------
locals {
  # Storage account name: 3-24 lowercase letters and numbers ONLY
  # Pattern: aiint{env}tfstate{random8} = max 24 chars
  # Example: aiintdevtfstate + 8 chars = 23 chars total (within 24 limit)
  storage_account_name = "aiint${var.environment}tfstate${random_string.suffix.result}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "terraform-state"
    ManagedBy   = "terraform-bootstrap"
  }
}

# -----------------------------------------------------------------------------
# Resource Group for Terraform State
# Separate from application resources for security isolation
# -----------------------------------------------------------------------------
resource "azurerm_resource_group" "tfstate" {
  name     = "${var.project_name}-${var.environment}-tfstate-rg"
  location = var.location
  tags     = local.common_tags

  lifecycle {
    # Prevent accidental deletion of state storage
    prevent_destroy = false # Set to true after initial deployment
  }
}

# -----------------------------------------------------------------------------
# Storage Account for Terraform State
# Best practices applied:
# - Standard_LRS for cost-effective state storage
# - Blob versioning enabled for state recovery
# - Soft delete for accidental deletion protection
# - No public blob access
# - HTTPS only
# - TLS 1.2 minimum
# -----------------------------------------------------------------------------
resource "azurerm_storage_account" "tfstate" {
  name                = local.storage_account_name
  resource_group_name = azurerm_resource_group.tfstate.name
  location            = azurerm_resource_group.tfstate.location

  # Cost-effective tier for state storage
  account_tier             = "Standard"
  account_replication_type = "LRS" # Use GRS/ZRS for production DR

  # Security settings
  account_kind                    = "StorageV2"
  min_tls_version                 = "TLS1_2"
  https_traffic_only_enabled      = true
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true # Required for backend auth

  # Blob properties for state protection
  blob_properties {
    versioning_enabled = true

    # Protect against accidental container deletion
    container_delete_retention_policy {
      days = 7
    }

    # Protect against accidental blob deletion
    delete_retention_policy {
      days = 7
    }
  }

  tags = local.common_tags

  lifecycle {
    prevent_destroy = false # Set to true after initial deployment
  }
}

# -----------------------------------------------------------------------------
# Blob Container for Terraform State
# Container name: 3-63 lowercase letters, numbers, and hyphens
# -----------------------------------------------------------------------------
resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_id    = azurerm_storage_account.tfstate.id
  container_access_type = "private"
}

# -----------------------------------------------------------------------------
# Outputs - Used to configure the backend in main infrastructure
# -----------------------------------------------------------------------------
output "resource_group_name" {
  description = "Resource group containing the state storage"
  value       = azurerm_resource_group.tfstate.name
}

output "storage_account_name" {
  description = "Storage account name for Terraform backend"
  value       = azurerm_storage_account.tfstate.name
}

output "container_name" {
  description = "Blob container name for Terraform state"
  value       = azurerm_storage_container.tfstate.name
}

output "primary_access_key" {
  description = "Storage account primary access key (sensitive)"
  value       = azurerm_storage_account.tfstate.primary_access_key
  sensitive   = true
}

output "backend_config" {
  description = "Backend configuration for main Terraform"
  value       = <<-EOT
    # Add this to your infra/versions.tf or use -backend-config flags
    #
    # Option 1: Add backend block to versions.tf
    # terraform {
    #   backend "azurerm" {
    #     resource_group_name  = "${azurerm_resource_group.tfstate.name}"
    #     storage_account_name = "${azurerm_storage_account.tfstate.name}"
    #     container_name       = "${azurerm_storage_container.tfstate.name}"
    #     key                  = "${var.environment}.terraform.tfstate"
    #   }
    # }
    #
    # Option 2: Use backend config file (recommended)
    # Create backend.hcl with the values and run:
    # terraform init -backend-config=backend.hcl
    #
    # Option 3: Set ARM_ACCESS_KEY environment variable
    # PowerShell: $env:ARM_ACCESS_KEY = (terraform output -raw primary_access_key)
    # Bash: export ARM_ACCESS_KEY=$(terraform output -raw primary_access_key)
  EOT
}

output "backend_hcl_content" {
  description = "Content for backend.hcl file"
  value       = <<-EOT
    subscription_id      = "${var.subscription_id}"
    resource_group_name  = "${azurerm_resource_group.tfstate.name}"
    storage_account_name = "${azurerm_storage_account.tfstate.name}"
    container_name       = "${azurerm_storage_container.tfstate.name}"
    key                  = "${var.environment}.terraform.tfstate"
  EOT
}
