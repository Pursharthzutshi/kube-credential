#!/usr/bin/env bash
# deploy-without-cf.sh
# Create ECR repos, create EKS cluster with eksctl if missing, build & push images, deploy k8s manifests.
# Intended for CI or local usage where you cannot/choose not to use CloudFormation.
# REQUIRED env vars (can be set in GitHub Actions env):
#   AWS_REGION (default: us-east-1)
#   CLUSTER_NAME (default: zupple-eks)
#   NODE_INSTANCE_TYPE (default: t3.medium)
#   DEPLOY_FRONTEND (default: false) - set "true" to build & deploy frontend
#   DEPLOY_ISSUANCE (default: true)
#   DEPLOY_VERIFICATION (default: true)
#   IMAGE_TAG (optional, defaults to git short SHA or "latest")
#
# NOTE: Ensure the AWS principal used has necessary permissions:
# eks:* ec2:* iam:CreateRole iam:TagRole iam:PassRole cloudformation:* autoscaling:* elasticloadbalancing:* ecr:* sts:GetCallerIdentity
set -euo pipefail

# --- config with sensible defaults ---
AWS_REGION="${AWS_REGION:-us-east-1}"
CLUSTER_NAME="${CLUSTER_NAME:-zupple-eks}"
NODE_INSTANCE_TYPE="${NODE_INSTANCE_TYPE:-t3.medium}"
DEPLOY_FRONTEND="${DEPLOY_FRONTEND:-false}"
DEPLOY_ISSUANCE="${DEPLOY_ISSUANCE:-true}"
DEPLOY_VERIFICATION="${DEPLOY_VERIFICATION:-true}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo latest)}"

echo "==== deploy-without-cf.sh starting ===="
echo "AWS region: $AWS_REGION"
echo "Cluster: $CLUSTER_NAME"
echo "Node instance type: $NODE_INSTANCE_TYPE"
echo "Deploy frontend: $DEPLOY_FRONTEND"
echo "Deploy issuance: $DEPLOY_ISSUANCE"
echo "Deploy verification: $DEPLOY_VERIFICATION"
echo "Image tag: $IMAGE_TAG"

# Check tooling
for cmd in aws eksctl kubectl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: required command '$cmd' not found in PATH. Please install it before running this script."
    exit 1
  fi
done

# Get account id
AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
echo "Using AWS account: $AWS_ACCOUNT_ID"
echo "Caller ARN: $(aws sts get-caller-identity --query Arn --output text)"

# Define ECR URIs
FRONTEND_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${CLUSTER_NAME}-frontend"
ISSUANCE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${CLUSTER_NAME}-issuance"
VERIFICATION_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${CLUSTER_NAME}-verification"

# Create ECR repos (idempotent)
echo "--- Ensuring ECR repositories exist ---"
ensure_ecr_repo() {
  local name="$1"
  if aws ecr describe-repositories --repository-names "$name" --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "ECR repo $name already exists"
  else
    echo "Creating ECR repo $name"
    aws ecr create-repository --repository-name "$name" --region "$AWS_REGION" || true
    # small wait loop to ensure API returns the repo
    for i in {1..10}; do
      if aws ecr describe-repositories --repository-names "$name" --region "$AWS_REGION" >/dev/null 2>&1; then
        echo "Confirmed $name"
        break
      fi
      sleep 1
    done
  fi
}

[ "$DEPLOY_FRONTEND" = "true" ] && ensure_ecr_repo "${CLUSTER_NAME}-frontend"
[ "$DEPLOY_ISSUANCE" = "true" ] && ensure_ecr_repo "${CLUSTER_NAME}-issuance"
[ "$DEPLOY_VERIFICATION" = "true" ] && ensure_ecr_repo "${CLUSTER_NAME}-verification"

echo "Frontend URI: $FRONTEND_URI"
echo "Issuance URI: $ISSUANCE_URI"
echo "Verification URI: $VERIFICATION_URI"

# --- Ensure EKS cluster exists; create with eksctl if missing ---
echo "--- Ensuring EKS cluster exists ---"
if aws eks describe-cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "EKS cluster '$CLUSTER_NAME' already exists in $AWS_REGION"
else
  echo "EKS cluster '$CLUSTER_NAME' not found. Creating with eksctl..."
  # Create cluster (managed nodegroup). This can take 10-20 minutes.
  eksctl create cluster \
    --name "$CLUSTER_NAME" \
    --region "$AWS_REGION" \
    --node-type "${NODE_INSTANCE_TYPE}" \
    --nodes 2 \
    --nodes-min 1 \
    --nodes-max 3 \
    --managed
fi

# Wait until cluster status is ACTIVE
echo "Waiting for cluster to reach ACTIVE status..."
for i in {1..60}; do
  STATUS="$(aws eks describe-cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" --query 'cluster.status' --output text 2>/dev/null || echo NOTFOUND)"
  echo "Attempt $i: cluster status = $STATUS"
  if [ "$STATUS" = "ACTIVE" ]; then
    echo "Cluster is ACTIVE"
    break
  fi
  if [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "DELETING" ]; then
    echo "Cluster in unexpected state: $STATUS — inspect CloudFormation / eksctl logs"
    aws cloudformation list-stacks --region "$AWS_REGION" --query "StackSummaries[?contains(StackName, '$CLUSTER_NAME')].[StackName,StackStatus]" --output table || true
    exit 1
  fi
  sleep 15
done

# Final check
STATUS="$(aws eks describe-cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" --query 'cluster.status' --output text 2>/dev/null || echo NOTFOUND)"
if [ "$STATUS" != "ACTIVE" ]; then
  echo "ERROR: cluster did not reach ACTIVE state (last: $STATUS). Exiting."
  exit 1
fi

# Update kubeconfig
echo "--- Updating kubeconfig ---"
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"

# Wait for at least one node to be ready
echo "Waiting for nodes to be Ready..."
for i in {1..40}; do
  READY_NODES=$(kubectl get nodes --no-headers 2>/dev/null | grep -c " Ready " || true)
  echo "Attempt $i: Ready nodes = $READY_NODES"
  if [ "$READY_NODES" -ge 1 ]; then
    echo "At least one node is Ready"
    break
  fi
  sleep 15
done

# Login to ECR
echo "--- Logging into ECR ---"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# --- Build & push images (optional) ---
echo "--- Build & push images (conditional) ---"
if [ "$DEPLOY_ISSUANCE" = "true" ]; then
  echo "Building issuance image -> ${ISSUANCE_URI}:${IMAGE_TAG}"
  docker build -t "${ISSUANCE_URI}:${IMAGE_TAG}" ./backend/issuance-service
  docker push "${ISSUANCE_URI}:${IMAGE_TAG}"
fi

if [ "$DEPLOY_VERIFICATION" = "true" ]; then
  echo "Building verification image -> ${VERIFICATION_URI}:${IMAGE_TAG}"
  docker build -t "${VERIFICATION_URI}:${IMAGE_TAG}" ./backend/verification-service
  docker push "${VERIFICATION_URI}:${IMAGE_TAG}"
fi

if [ "$DEPLOY_FRONTEND" = "true" ]; then
  echo "Building frontend image -> ${FRONTEND_URI}:${IMAGE_TAG}"
  # if frontend build requires envs, set build-args as needed
  docker build -t "${FRONTEND_URI}:${IMAGE_TAG}" ./frontend
  docker push "${FRONTEND_URI}:${IMAGE_TAG}"
fi

# --- Apply Kubernetes manifests with image substitution ---
echo "--- Apply Kubernetes manifests ---"
# Substitute images in deployments (create temp files)
if [ -f k8s/frontend-deployment.yaml ]; then
  sed "s#yourdockerhub/kube-frontend:latest#${FRONTEND_URI}:${IMAGE_TAG}#g" k8s/frontend-deployment.yaml > /tmp/frontend-deployment.yaml
fi
if [ -f k8s/issuance-deployment.yaml ]; then
  sed "s#yourdockerhub/issuance-service:latest#${ISSUANCE_URI}:${IMAGE_TAG}#g" k8s/issuance-deployment.yaml > /tmp/issuance-deployment.yaml
fi
if [ -f k8s/verification-deployment.yaml ]; then
  sed "s#yourdockerhub/verification-service:latest#${VERIFICATION_URI}:${IMAGE_TAG}#g" k8s/verification-deployment.yaml > /tmp/verification-deployment.yaml
fi

# Apply base resources first
kubectl apply -f k8s/namespace.yaml || true
kubectl apply -f k8s/mongo-deployment.yaml || true
kubectl apply -f k8s/issuance-service.yaml || true
kubectl apply -f k8s/verification-service.yaml || true

# Apply deployments and wait for rollout
if [ -f /tmp/issuance-deployment.yaml ] && [ "$DEPLOY_ISSUANCE" = "true" ]; then
  kubectl apply -f /tmp/issuance-deployment.yaml
  kubectl rollout status deployment/issuance-deployment --timeout=300s || true
fi

if [ -f /tmp/verification-deployment.yaml ] && [ "$DEPLOY_VERIFICATION" = "true" ]; then
  kubectl apply -f /tmp/verification-deployment.yaml
  kubectl rollout status deployment/verification-deployment --timeout=300s || true
fi

if [ -f /tmp/frontend-deployment.yaml ] && [ "$DEPLOY_FRONTEND" = "true" ]; then
  kubectl apply -f /tmp/frontend-deployment.yaml
  kubectl rollout status deployment/frontend-deployment --timeout=300s || true
fi

echo "=== Services ==="
kubectl get svc -o wide || true
echo "=== Pods ==="
kubectl get pods -o wide || true

echo "Deployment finished."
