#!/bin/bash

# Production Deployment Script for Restaurant Management Backend
# Usage: ./scripts/deploy-prod.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found!"
    print_status "Please create .env.production file with your production environment variables"
    exit 1
fi

print_status "Starting production deployment..."

# Step 1: Environment validation
print_status "Validating environment variables..."
node scripts/check-env.js

# Step 2: Type checking
print_status "Running TypeScript type checking..."
npm run type-check

# Step 3: Linting
print_status "Running ESLint..."
npm run lint

# Step 4: Tests
print_status "Running tests..."
npm test

# Step 5: Build
print_status "Building application..."
npm run build

# Step 6: Docker build
print_status "Building Docker image..."
docker build -t restaurant-management-api:latest .

# Step 7: Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Step 8: Start production containers
print_status "Starting production containers..."
docker-compose -f docker-compose.prod.yml up -d

# Step 9: Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Step 10: Health check
print_status "Performing health check..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "Health check passed! Application is running successfully."
else
    print_error "Health check failed! Please check the logs."
    docker-compose -f docker-compose.prod.yml logs api
    exit 1
fi

print_status "Production deployment completed successfully!"
print_status "Application is available at: http://localhost:3000"
print_status "API Documentation: http://localhost:3000/api-docs" 