# PowerShell Script to Sync LegalFinanceApp project with GitHub
# Author: Antigravity AI
# Repository: https://github.com/eshwar2005/LegalFinanceApp

$repoUrl = "https://github.com/eshwar2005/LegalFinanceApp"

Write-Host "Starting GitHub Sync for LegalFinanceApp..."

# Check if git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not installed or not in your PATH."
    Write-Host "Please install Git from https://git-scm.com/"
    exit
}

# Initialize Git if necessary
if (!(Test-Path .git)) {
    Write-Host "Initializing new Git repository..."
    git init
}

# Check for remote origin
$remote = git remote get-url origin 2>$null
if (!$remote) {
    Write-Host "Adding remote origin: $repoUrl"
    git remote add origin ($repoUrl + ".git")
}

# Ensure the branch is named 'main'
Write-Host "Ensuring branch is named 'main'..."
git branch -M main

# Stage all changes
Write-Host "Staging changes..."
git add .

# Set commit message
$dateStr = Get-Date -Format "yyyy-MM-dd HH-mm-ss"
$commitMsg = "Dynamic update: " + $dateStr
Write-Host "Committing changes with message: $commitMsg"
git commit -m "$commitMsg"

# Push to main branch
Write-Host "Pushing to GitHub..."
git push -u origin main

Write-Host "Sync Complete! Your GitHub profile is now up to date."
Write-Host "Check it out at: $repoUrl"
