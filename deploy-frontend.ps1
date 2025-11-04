# Ynova Frontend - ECR Deployment Script
# This script builds the Docker image and pushes it to AWS ECR
# Based on the ECR/Docker deployment steps from README.md

param(
    [string]$Region = "us-east-2",
    [string]$AccountId = "646057971790",
    [string]$RepositoryName = "ynova-portal-frontend",
    [string]$ImageTag = "latest",
    [string]$ApiBaseUrl = "https://api.ynovamarketplace.com.br"
)

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$White = "White"

Write-Host "===============================================" -ForegroundColor $Cyan
Write-Host "  Ynova Portal Frontend - ECR Deployment Script" -ForegroundColor $Cyan
Write-Host "===============================================" -ForegroundColor $Cyan
Write-Host ""

# Configuration
$ECR_URI = "${AccountId}.dkr.ecr.${Region}.amazonaws.com"
$FullImageName = "${ECR_URI}/${RepositoryName}:${ImageTag}"

Write-Host "Configuration:" -ForegroundColor $Yellow
Write-Host "  Region: $Region" -ForegroundColor $White
Write-Host "  Account ID: $AccountId" -ForegroundColor $White
Write-Host "  Repository: $RepositoryName" -ForegroundColor $White
Write-Host "  Image Tag: $ImageTag" -ForegroundColor $White
Write-Host "  API Base URL: $ApiBaseUrl" -ForegroundColor $White
Write-Host "  Full Image Name: $FullImageName" -ForegroundColor $White
Write-Host ""

# Step 1: Build Docker Image
Write-Host "Step 1: Building Docker image..." -ForegroundColor $Yellow
try {
    docker build --build-arg VITE_API_BASE_URL=$ApiBaseUrl -t $RepositoryName .
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed"
    }
    Write-Host "Docker image built successfully" -ForegroundColor $Green
} catch {
    Write-Host "Failed to build Docker image: $_" -ForegroundColor $Red
    exit 1
}

Write-Host ""

# Step 2: Tag the image for ECR
Write-Host "Step 2: Tagging image for ECR..." -ForegroundColor $Yellow
try {
    docker tag "${RepositoryName}:latest" $FullImageName
    if ($LASTEXITCODE -ne 0) {
        throw "Docker tag failed"
    }
    Write-Host "Image tagged successfully" -ForegroundColor $Green
} catch {
    Write-Host "Failed to tag image: $_" -ForegroundColor $Red
    exit 1
}

Write-Host ""

# Step 3: Authenticate with ECR
Write-Host "Step 3: Authenticating with ECR..." -ForegroundColor $Yellow
try {
    $loginCommand = "aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $ECR_URI"
    Invoke-Expression $loginCommand
    if ($LASTEXITCODE -ne 0) {
        throw "ECR login failed"
    }
    Write-Host "Successfully authenticated with ECR" -ForegroundColor $Green
} catch {
    Write-Host "Failed to authenticate with ECR: $_" -ForegroundColor $Red
    Write-Host "Make sure you have AWS CLI configured and proper permissions" -ForegroundColor $Yellow
    exit 1
}

Write-Host ""

# Step 4: Push to ECR
Write-Host "Step 4: Pushing image to ECR..." -ForegroundColor $Yellow
try {
    docker push $FullImageName
    if ($LASTEXITCODE -ne 0) {
        throw "Docker push failed"
    }
    Write-Host "Image pushed to ECR successfully" -ForegroundColor $Green
} catch {
    Write-Host "Failed to push image to ECR: $_" -ForegroundColor $Red
    exit 1
}

Write-Host ""

# Success message
Write-Host "===============================================" -ForegroundColor $Green
Write-Host "  Deployment completed successfully!" -ForegroundColor $Green
Write-Host "===============================================" -ForegroundColor $Green
Write-Host ""
Write-Host "Your frontend image is now available at:" -ForegroundColor $Cyan
Write-Host "  $FullImageName" -ForegroundColor $White
Write-Host ""
Write-Host "Configuration used:" -ForegroundColor $Yellow
Write-Host "  API Base URL: $ApiBaseUrl" -ForegroundColor $White
Write-Host "  Frontend will be served on port 80 inside container" -ForegroundColor $White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor $Yellow
Write-Host "  1. Update your ECS service or Docker Compose to use the new image" -ForegroundColor $White
Write-Host "  2. Monitor the deployment in your AWS console" -ForegroundColor $White
Write-Host "  3. Check application health at your frontend URL" -ForegroundColor $White
Write-Host ""

# Optional: Clean up local images
$cleanup = Read-Host "Do you want to clean up local Docker images? (y/N)"
if ($cleanup -eq "y" -or $cleanup -eq "Y") {
    Write-Host "Cleaning up local images..." -ForegroundColor $Yellow
    docker rmi $RepositoryName:latest $FullImageName
    Write-Host "Local images cleaned up" -ForegroundColor $Green
}

Write-Host ""
Write-Host "Frontend deployment script completed!" -ForegroundColor $Green
