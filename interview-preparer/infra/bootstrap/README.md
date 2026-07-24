# Terraform State Storage Bootstrap

This directory contains the Terraform configuration to create Azure Blob Storage for Terraform remote state.

## Why Remote State?

- **Team Collaboration**: Multiple developers can work on infrastructure safely
- **State Locking**: Prevents concurrent modifications (automatic with Azure Blob)
- **State Protection**: Versioning and soft delete protect against accidental loss
- **Security**: Sensitive data is stored securely, not in local files or git

## Prerequisites

- Azure CLI installed and authenticated (`az login`)
- Terraform CLI >= 1.9 installed
- Azure subscription with contributor access

## Quick Start

### 1. Configure Variables

```powershell
# Copy the example file
Copy-Item terraform.tfvars.example terraform.tfvars

# Edit with your subscription ID
notepad terraform.tfvars
```

### 2. Create State Storage

```powershell
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Create the resources
terraform apply
```

### 3. Configure Main Infrastructure Backend

After successful apply, you'll see outputs with the storage details. Use one of these methods:

#### Option A: Create Backend Config File (Recommended)

```powershell
# Create backend.hcl from output
terraform output -raw backend_hcl_content > ../backend.hcl

# Initialize main infrastructure with backend config
cd ..
terraform init -backend-config=backend.hcl
```

#### Option B: Environment Variable

```powershell
# Set access key as environment variable
$env:ARM_ACCESS_KEY = $(terraform output -raw primary_access_key)

# Then in main infra directory
cd ..
terraform init
```

## Created Resources

| Resource | Name Pattern | Purpose |
|----------|--------------|---------|
| Resource Group | `ai-interview-{env}-tfstate-rg` | Isolation for state storage |
| Storage Account | `aiint{env}tfstate{random8}` | Blob storage for state files |
| Blob Container | `tfstate` | Container for state blobs |

## Security Features

- ✅ **Blob Versioning**: Recover previous state versions
- ✅ **Soft Delete**: 7-day retention for deleted containers/blobs
- ✅ **HTTPS Only**: Encrypted in transit (TLS 1.2+)
- ✅ **Private Access**: No public blob access
- ✅ **Standard Encryption**: Encrypted at rest (Azure managed keys)

## Cost Estimate

- Storage Account: ~$0.50/month (Standard LRS, minimal usage)
- Blob Storage: Negligible (state files are typically < 1MB)
- **Total**: < $1/month for state storage

## Production Recommendations

1. **Change to GRS replication** for geo-redundancy:
   ```hcl
   account_replication_type = "GRS"
   ```

2. **Enable `prevent_destroy`** after initial deployment:
   ```hcl
   lifecycle {
     prevent_destroy = true
   }
   ```

3. **Add network rules** to restrict access:
   ```hcl
   network_rules {
     default_action = "Deny"
     ip_rules       = ["your-ip-range"]
   }
   ```

4. **Use Azure Key Vault** for access keys instead of environment variables

## Troubleshooting

### "Storage account name already exists"

Storage account names must be globally unique. The random suffix should prevent this, but if it happens:

```powershell
# Force new random suffix
terraform taint random_string.suffix
terraform apply
```

### "Access denied" errors

Ensure you're logged in with appropriate permissions:

```powershell
az login
az account set --subscription "your-subscription-id"
az account show
```
