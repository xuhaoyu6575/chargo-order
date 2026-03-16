# Auto install gh CLI, create repo and push
$ErrorActionPreference = "Stop"

# 1. Install gh CLI if not found
$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Write-Host "Installing GitHub CLI..."
    winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements --silent
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# 2. Check gh auth (requires interactive login first time)
$authResult = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "GitHub login required. Run: gh auth login"
    Write-Host "Then run this script again."
    exit 1
}

# 3. Create repo and push
gh repo view xuhaoyu6575/chargo-order 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating repository..."
    gh repo create chargo-order --public --source . --remote origin --push
} else {
    Write-Host "Pushing..."
    git remote set-url origin https://github.com/xuhaoyu6575/chargo-order.git
    git branch -M main
    git push -u origin main
}

Write-Host "Done: https://github.com/xuhaoyu6575/chargo-order"
