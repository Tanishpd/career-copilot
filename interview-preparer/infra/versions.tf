# =========================================================================
# AI Tech Interview - Terraform Version Constraints
# Following Azure Verified Modules (AVM) specifications:
# - TFNFR25: Terraform CLI version constraints
# - TFFR3: Provider permitted versions
# - TFNFR26: Provider configuration in required_providers
# =========================================================================

terraform {
  # Terraform CLI version constraint
  # Using pessimistic constraint (~>) as recommended by AVM
  # ~> 1.9 means >= 1.9.0 and < 2.0.0
  # Reference: https://azure.github.io/Azure-Verified-Modules/spec/TFNFR25
  required_version = "~> 1.9"

  # ---------------------------------------------------------------------------
  # Remote State Backend - Azure Blob Storage
  # ---------------------------------------------------------------------------
  # State is stored in Azure Blob Storage for:
  # - Team collaboration (shared state)
  # - State locking (automatic with Azure Blob)
  # - State protection (versioning, soft delete)
  # - Security (sensitive data not in local files/git)
  #
  # SETUP: Before using this backend, run the bootstrap configuration:
  #   1. cd infra/bootstrap
  #   2. terraform init && terraform apply
  #   3. terraform output -raw backend_hcl_content > ../backend.hcl
  #   4. cd .. && terraform init -backend-config=backend.hcl
  #
  # Reference: https://learn.microsoft.com/en-us/azure/developer/terraform/store-state-in-azure-storage
  # ---------------------------------------------------------------------------
  backend "azurerm" {
    # Values provided via -backend-config=backend.hcl or environment variables
    # Do NOT hardcode values here - they come from bootstrap output
    #
    # Required backend.hcl contents:
    #   resource_group_name  = "ai-interview-dev-tfstate-rg"
    #   storage_account_name = "aiintdevtfstateXXXXXXXX"
    #   container_name       = "tfstate"
    #   key                  = "dev.terraform.tfstate"
    #
    # Alternative: Set ARM_ACCESS_KEY environment variable
    #   PowerShell: $env:ARM_ACCESS_KEY = "<access-key>"
  }

  required_providers {
    # Providers sorted alphabetically per TFNFR26

    # AzureRM Provider - Required for Azure resource management
    # Version constraint: ~> 4.0 (>= 4.0, < 5.0) per TFFR3
    # Reference: https://azure.github.io/Azure-Verified-Modules/spec/TFFR3
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }

    # Random Provider - Used for generating unique resource name suffixes
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}
