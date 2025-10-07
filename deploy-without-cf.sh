#!/bin/bash

# Alternative deployment script that creates EKS cluster and ECR repos without CloudFormation
# This script requires fewer permissions than CloudFormation-based deployment

set -e

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
CLUSTER_NAME=${CLUSTER_NAME:-zupple-eks}
NODE_INSTANCE_TYPE=${NODE_INSTANCE_TYPE:-t3.medium}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Deploying to AWS Account: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo "Cluster Name: $CLUSTER_NAME"

# Create ECR repositories
echo "Creating ECR repositories..."
aws ecr create-repository --repository-name $CLUSTER_NAME-frontend --region $AWS_REGION 2>/dev/null || echo "Frontend repo already exists"
aws ecr create-repository --repository-name $CLUSTER_NAME-issuance --region $AWS_REGION 2>/dev/null || echo "Issuance repo already exists"
aws ecr create-repository --repository-name $CLUSTER_NAME-verification --region $AWS_REGION 2>/dev/null || echo "Verification repo already exists"

# Set ECR URIs
FRONTEND_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$CLUSTER_NAME-frontend"
ISSUANCE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$CLUSTER_NAME-issuance"
VERIFICATION_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$CLUSTER_NAME-verification"

echo "ECR URIs:"
echo "  Frontend: $FRONTEND_URI"
echo "  Issuance: $ISSUANCE_URI"
echo "  Verification: $VERIFICATION_URI"

# Check if EKS cluster exists
if aws eks describe-cluster --name $CLUSTER_NAME --region $AWS_REGION >/dev/null 2>&1; then
    echo "EKS cluster $CLUSTER_NAME already exists"
else
    echo "EKS cluster $CLUSTER_NAME does not exist. Please create it manually or request CloudFormation permissions."
    echo ""
    echo "To create the EKS cluster manually, run:"
    echo "eksctl create cluster --name $CLUSTER_NAME --region $AWS_REGION --node-type $NODE_INSTANCE_TYPE --nodes 2"
    echo ""
    echo "Or use the AWS Console to create the cluster with the following specifications:"
    echo "  - Name: $CLUSTER_NAME"
    echo "  - Kubernetes version: 1.29"
    echo "  - Node group instance type: $NODE_INSTANCE_TYPE"
    echo "  - Node group desired size: 2"
    echo ""
    exit 1
fi

# Get EKS cluster endpoint
CLUSTER_ENDPOINT=$(aws eks describe-cluster --name $CLUSTER_NAME --region $AWS_REGION --query 'cluster.endpoint' --output text)

# Update kubeconfig
echo "Updating kubeconfig..."
aws eks update-kubeconfig --name $CLUSTER_NAME --region $AWS_REGION

# Wait for nodes to be ready
echo "Waiting for nodes to be ready..."
for i in {1..30}; do
    READY_NODES=$(kubectl get nodes --no-headers | grep -c ' Ready ' || true)
    if [ "$READY_NODES" -ge 1 ]; then
        echo "Nodes are ready"
        break
    fi
    echo "Waiting for nodes... ($i/30)"
    sleep 20
done

# ECR Login
echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push images (this would be done by GitHub Actions in the actual workflow)
echo "Building and pushing images..."
echo "Note: In GitHub Actions, this step would build and push the Docker images"
echo "For local testing, you would run:"
echo "  docker build -t $FRONTEND_URI:latest ./frontend && docker push $FRONTEND_URI:latest"
echo "  docker build -t $ISSUANCE_URI:latest ./backend/issuance-service && docker push $ISSUANCE_URI:latest"
echo "  docker build -t $VERIFICATION_URI:latest ./backend/verification-service && docker push $VERIFICATION_URI:latest"

# Apply Kubernetes manifests with image substitution
echo "Applying Kubernetes manifests..."
sed "s#yourdockerhub/kube-frontend:latest#$FRONTEND_URI:latest#g" k8s/frontend-deployment.yaml > /tmp/frontend.yaml
sed "s#yourdockerhub/issuance-service:latest#$ISSUANCE_URI:latest#g" k8s/issuance-deployment.yaml > /tmp/issuance.yaml
sed "s#yourdockerhub/verification-service:latest#$VERIFICATION_URI:latest#g" k8s/verification-deployment.yaml > /tmp/verification.yaml

kubectl apply -f k8s/mongo-deployment.yaml
kubectl apply -f /tmp/issuance.yaml
kubectl apply -f /tmp/verification.yaml
kubectl apply -f /tmp/frontend.yaml

echo "Deployment complete!"
echo "Check services with: kubectl get svc -o wide"
