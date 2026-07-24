# 🏗️ AI Tech Interview - Infrastructure

This directory contains Terraform configurations to provision the required Azure resources for the AI Tech Interview Preparation platform.

## 📋 Version Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| **Terraform CLI** | ~> 1.9 | [Install Terraform](https://developer.hashicorp.com/terraform/install) |
| **AzureRM Provider** | ~> 4.0 | Azure Verified Modules compliant |
| **Random Provider** | ~> 3.6 | For unique resource naming |

> 💡 **Best Practices:** This configuration follows [Azure Verified Modules (AVM)](https://azure.github.io/Azure-Verified-Modules/) specifications including TFFR3 (provider versions) and TFNFR25 (Terraform version constraints).

## 📋 Resources Created

| Resource | Description | SKU |
|----------|-------------|-----|
| **Resource Group** | Container for all resources | - |
| **Azure OpenAI** | LLM for question generation & evaluation | S0 (only option, pay-as-you-go) |
| **GPT-4o-mini Deployment** | Model deployment for AI operations | Standard |
| **Azure Speech Service** | TTS & STT capabilities | S0 (cheapest non-free, pay-as-you-go) |

## 🚀 Quick Start

### Prerequisites

1. **Azure CLI** - [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Terraform** - [Install Terraform](https://developer.hashicorp.com/terraform/install) (~> 1.9)
3. **Azure Subscription** with:
   - Azure OpenAI access approved
   - Contributor role or higher

### Step 1: Authenticate with Azure

```powershell
az login
az account set --subscription "your-subscription-id"
```

### Step 2: Bootstrap Remote State (First Time Only)

Remote state enables team collaboration and state protection:

```powershell
cd infra/bootstrap

# Configure your subscription ID
Copy-Item terraform.tfvars.example terraform.tfvars
notepad terraform.tfvars  # Add your subscription_id

# Create state storage
terraform init
terraform apply

# Generate backend config for main infrastructure
terraform output -raw backend_hcl_content > ../backend.hcl
```

### Step 3: Configure Main Infrastructure

```powershell
cd ..  # Back to infra directory
Copy-Item terraform.tfvars.example terraform.tfvars
notepad terraform.tfvars  # Add your subscription_id
```

### Step 4: Initialize with Remote Backend

```powershell
terraform init --backend-config=backend.hcl
```

### Step 5: Review the Plan

```powershell
terraform plan
```

### Step 6: Apply the Configuration

```powershell
terraform apply
```

Type `yes` when prompted to confirm.

### Step 7: Generate .env.local

After successful deployment, generate your environment file:

```powershell
terraform output -raw env_file_content > ../.env.local
```

> ⚠️ **Security Note:** The `.env.local` file contains sensitive keys. Never commit it to version control.

## 📤 Outputs

After deployment, you can view outputs:

```powershell
# View all outputs
terraform output

# View specific output (non-sensitive)
terraform output openai_endpoint

# View sensitive output
terraform output -raw openai_primary_key
```

## 🔧 Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `subscription_id` | Azure Subscription ID | *Required* |
| `project_name` | Project name for resources | `ai-interview` |
| `environment` | Environment (dev/staging/prod) | `dev` |
| `location` | Primary Azure region | `southcentralus` |
| `openai_location` | Azure OpenAI region | `southcentralus` |
| `openai_capacity` | TPM capacity (thousands) | `30` |
| `speech_sku` | Speech tier (F0/S0) | `S0` |

## ✅ Phase 1 Resources Verification

This infrastructure provides all Azure resources needed for Phase 1:

| Feature | Azure Resource | Status |
|---------|---------------|--------|
| Question Generation | Azure OpenAI (GPT-4o-mini) | ✅ Configured |
| Response Evaluation | Azure OpenAI (GPT-4o-mini) | ✅ Configured |
| Text-to-Speech | Azure Speech Service | ✅ Configured |
| Speech-to-Text | Azure Speech Service | ✅ Configured |

### Model Availability (southcentralus region)

| Model | Version | Availability |
|-------|---------|-------------|
| gpt-4o-mini | 2024-07-18 | ✅ Standard deployment |
| Speech Neural Voices | - | ✅ All voices available |

### ⚠️ Region Availability Notes

| Region | Azure OpenAI gpt-4o-mini | Azure Speech |
|--------|--------------------------|---------------|
| **southcentralus** | ✅ Available | ✅ Available |
| centralus | ❌ NOT available | ✅ Available |
| eastus | ✅ Available | ✅ Available |
| westus | ✅ Available | ✅ Available |
| northcentralus | ✅ Available | ✅ Available |

> 📝 **Note:** The default region is `southcentralus` because it supports all required services. **Central US does NOT have gpt-4o-mini**. See [Azure OpenAI model availability](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#model-summary-table-and-region-availability).

## 💰 Cost Estimation

> 📊 **For detailed pricing information, see the [Cost Estimation section](../README.md#-cost-estimation) in the main README.**

**Quick Estimates:**
- **Development:** ~$1-2/month (or $0 with Free F0 Speech tier)
- **Moderate Usage:** ~$15-25/month
- **Production:** ~$40-90/month

> 💡 **Tip:** For development/testing, use `speech_sku = "F0"` (free tier: 500K TTS characters + 5 hours STT/month)

## 🧹 Cleanup

To destroy all application resources:

```powershell
terraform destroy
```

Type `yes` when prompted.

> ⚠️ **Note:** This destroys application resources only. To destroy state storage, run `terraform destroy` in the `bootstrap/` directory **after** destroying all application resources.

## 🗄️ Remote State

This project uses Azure Blob Storage for Terraform remote state:

| Feature | Description |
|---------|-------------|
| **State Locking** | Automatic with Azure Blob - prevents concurrent modifications |
| **State Protection** | Versioning + soft delete enabled (7-day recovery) |
| **Encryption** | At rest (Azure managed keys) and in transit (TLS 1.2+) |
| **Team Collaboration** | Shared state accessible by team members with Azure access |

### Backend Configuration Files

| File | Purpose | Git Status |
|------|---------|------------|
| `backend.hcl` | Backend connection details | Git-ignored |
| `bootstrap/terraform.tfvars` | Bootstrap subscription ID | Git-ignored |
| `terraform.tfvars` | Main config subscription ID | Git-ignored |

### Cost

State storage costs ~$0.50/month (Standard LRS, minimal usage).

## 🔒 Security Best Practices

1. **Never commit `terraform.tfvars`** - Contains subscription ID
2. **Never commit `backend.hcl`** - Contains storage account details
3. **Never commit `.env.local`** - Contains API keys
4. **Use Azure Key Vault** for production secrets
5. **Enable Private Endpoints** for production workloads
6. **Rotate keys regularly** using Azure portal or CLI

## 📚 Resources

- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Azure Speech Service Documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/)
- [Terraform AzureRM Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
