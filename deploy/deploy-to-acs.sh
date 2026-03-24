#!/usr/bin/env bash
# 一键：构建镜像 → 推送 ACR →（可选）创建拉镜像 Secret → kubectl 部署到已连接的 ACS/K8s 集群
# 用法：
#   cd 项目根目录
#   cp deploy/deploy.env.example deploy/deploy.env   # 编辑填写
#   bash deploy/deploy-to-acs.sh
#
# 仅部署（不构建、不推送）：  SKIP_BUILD=1 SKIP_PUSH=1 bash deploy/deploy-to-acs.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TMP_K="$SCRIPT_DIR/k8s/.tmp-kustomize"
ENV_FILE="${DEPLOY_ENV:-$SCRIPT_DIR/deploy.env}"

cd "$ROOT"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
else
  echo "未找到 $ENV_FILE"
  echo "请执行: cp deploy/deploy.env.example deploy/deploy.env 并填写 ACR_REGISTRY、ACR_NAMESPACE、IMAGE_TAG"
  exit 1
fi

: "${ACR_REGISTRY:?请设置 ACR_REGISTRY}"
: "${ACR_NAMESPACE:?请设置 ACR_NAMESPACE}"
: "${IMAGE_TAG:?请设置 IMAGE_TAG}"

SKIP_BUILD="${SKIP_BUILD:-0}"
SKIP_PUSH="${SKIP_PUSH:-0}"
SKIP_APPLY="${SKIP_APPLY:-0}"
WITH_PULL_SECRET="${WITH_PULL_SECRET:-0}"

for cmd in docker kubectl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "未找到命令: $cmd ，请先安装"
    exit 1
  fi
done

API_IMAGE="${ACR_REGISTRY}/${ACR_NAMESPACE}/robot-op-api"
FE_IMAGE="${ACR_REGISTRY}/${ACR_NAMESPACE}/robot-op-frontend"

echo "==> 配置: API=${API_IMAGE}:${IMAGE_TAG}  FE=${FE_IMAGE}:${IMAGE_TAG}"

if [[ "$SKIP_BUILD" != "1" ]]; then
  echo "==> 构建镜像..."
  docker build -t "robot-op-api:${IMAGE_TAG}" ./robot_op_center_springboot_v1
  docker build -t "robot-op-frontend:${IMAGE_TAG}" ./robot_op_center_frontend
else
  echo "==> 跳过构建 (SKIP_BUILD=1)"
fi

if [[ "$SKIP_PUSH" != "1" ]]; then
  if [[ -n "${ACR_USERNAME:-}" && -n "${ACR_PASSWORD:-}" ]]; then
    echo "==> docker login ${ACR_REGISTRY}"
    echo "${ACR_PASSWORD}" | docker login "${ACR_REGISTRY}" --username "${ACR_USERNAME}" --password-stdin
  else
    echo "==> 未设置 ACR_USERNAME/ACR_PASSWORD，假设已 docker login；若 push 失败请先登录 ACR"
  fi
  echo "==> 打标签并推送..."
  docker tag "robot-op-api:${IMAGE_TAG}" "${API_IMAGE}:${IMAGE_TAG}"
  docker tag "robot-op-frontend:${IMAGE_TAG}" "${FE_IMAGE}:${IMAGE_TAG}"
  docker push "${API_IMAGE}:${IMAGE_TAG}"
  docker push "${FE_IMAGE}:${IMAGE_TAG}"
else
  echo "==> 跳过推送 (SKIP_PUSH=1)"
fi

rm -rf "$TMP_K"
mkdir -p "$TMP_K"

if [[ "$WITH_PULL_SECRET" == "1" ]]; then
  if [[ -z "${ACR_USERNAME:-}" || -z "${ACR_PASSWORD:-}" ]]; then
    echo "WITH_PULL_SECRET=1 时需要 ACR_USERNAME 与 ACR_PASSWORD"
    exit 1
  fi
  echo "==> 创建命名空间与拉镜像 Secret（robot-op-center / acr-regcred）"
  kubectl create namespace robot-op-center --dry-run=client -o yaml | kubectl apply -f -
  kubectl create secret docker-registry acr-regcred \
    --docker-server="${ACR_REGISTRY}" \
    --docker-username="${ACR_USERNAME}" \
    --docker-password="${ACR_PASSWORD}" \
    --namespace=robot-op-center \
    --dry-run=client -o yaml | kubectl apply -f -

  cat >"$TMP_K/kustomization.yaml" <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: robot-op-center
resources:
  - ../base/namespace.yaml
  - ../base/api.yaml
  - ../base/frontend.yaml
patchesStrategicMerge:
  - pull-secret-api.yaml
  - pull-secret-frontend.yaml
images:
  - name: robot-op-api
    newName: ${API_IMAGE}
    newTag: "${IMAGE_TAG}"
  - name: robot-op-frontend
    newName: ${FE_IMAGE}
    newTag: "${IMAGE_TAG}"
EOF

  cat >"$TMP_K/pull-secret-api.yaml" <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: robot-op-api
  namespace: robot-op-center
spec:
  template:
    spec:
      imagePullSecrets:
        - name: acr-regcred
EOF

  cat >"$TMP_K/pull-secret-frontend.yaml" <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: robot-op-frontend
  namespace: robot-op-center
spec:
  template:
    spec:
      imagePullSecrets:
        - name: acr-regcred
EOF
else
  cat >"$TMP_K/kustomization.yaml" <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: robot-op-center
resources:
  - ../base/namespace.yaml
  - ../base/api.yaml
  - ../base/frontend.yaml
images:
  - name: robot-op-api
    newName: ${API_IMAGE}
    newTag: "${IMAGE_TAG}"
  - name: robot-op-frontend
    newName: ${FE_IMAGE}
    newTag: "${IMAGE_TAG}"
EOF
fi

if [[ "$SKIP_APPLY" != "1" ]]; then
  echo "==> kubectl apply -k $TMP_K"
  kubectl apply -k "$TMP_K"
  echo ""
  echo "完成。查看进度: kubectl get pods -n robot-op-center -w"
  echo "访问地址: kubectl get svc robot-op-frontend -n robot-op-center"
else
  echo "==> 跳过 kubectl (SKIP_APPLY=1)，临时清单位于: $TMP_K"
fi
