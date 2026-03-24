# 一键：构建镜像 -> 推送 ACR ->（可选）创建拉镜像 Secret -> kubectl 部署
# 用法（在项目根目录）：
#   Copy-Item deploy\deploy.env.example deploy\deploy.env
#   # 编辑 deploy\deploy.env
#   .\deploy\deploy-to-acs.ps1
#
# 仅部署： $env:SKIP_BUILD='1'; $env:SKIP_PUSH='1'; .\deploy\deploy-to-acs.ps1

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$TmpK = Join-Path $ScriptDir 'k8s\.tmp-kustomize'
$EnvFile = if ($env:DEPLOY_ENV) { $env:DEPLOY_ENV } else { Join-Path $ScriptDir 'deploy.env' }

Set-Location $Root

if (-not (Test-Path -LiteralPath $EnvFile)) {
    Write-Host "未找到 $EnvFile"
    Write-Host "请执行: Copy-Item deploy\deploy.env.example deploy\deploy.env 并填写 ACR_REGISTRY、ACR_NAMESPACE、IMAGE_TAG"
    exit 1
}

Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
        $key = $Matches[1]
        $val = $Matches[2].Trim().TrimEnd("`r")
        if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
        Set-Item -Path "env:$key" -Value $val
    }
}

foreach ($req in @('ACR_REGISTRY', 'ACR_NAMESPACE', 'IMAGE_TAG')) {
    if (-not (Test-Path "env:$req") -or [string]::IsNullOrWhiteSpace((Get-Item "env:$req").Value)) {
        Write-Host "请设置环境变量 $req（在 deploy.env 中）"
        exit 1
    }
}

$ACR_REGISTRY = (Get-Item env:ACR_REGISTRY).Value.TrimEnd('/')
$ACR_NAMESPACE = (Get-Item env:ACR_NAMESPACE).Value
$IMAGE_TAG = (Get-Item env:IMAGE_TAG).Value
$SKIP_BUILD = if ($env:SKIP_BUILD -eq '1') { '1' } else { '0' }
$SKIP_PUSH = if ($env:SKIP_PUSH -eq '1') { '1' } else { '0' }
$SKIP_APPLY = if ($env:SKIP_APPLY -eq '1') { '1' } else { '0' }
$WITH_PULL_SECRET = if ($env:WITH_PULL_SECRET -eq '1') { '1' } else { '0' }

foreach ($cmd in @('docker', 'kubectl')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "未找到命令: $cmd"
        exit 1
    }
}

$API_IMAGE = "$ACR_REGISTRY/$ACR_NAMESPACE/robot-op-api"
$FE_IMAGE = "$ACR_REGISTRY/$ACR_NAMESPACE/robot-op-frontend"
Write-Host "==> 配置: API=${API_IMAGE}:${IMAGE_TAG}  FE=${FE_IMAGE}:${IMAGE_TAG}"

if ($SKIP_BUILD -ne '1') {
    Write-Host '==> 构建镜像...'
    docker build -t "robot-op-api:$IMAGE_TAG" (Join-Path $Root 'robot_op_center_springboot_v1')
    docker build -t "robot-op-frontend:$IMAGE_TAG" (Join-Path $Root 'robot_op_center_frontend')
} else {
    Write-Host '==> 跳过构建 (SKIP_BUILD=1)'
}

if ($SKIP_PUSH -ne '1') {
    $u = (Get-Item env:ACR_USERNAME -ErrorAction SilentlyContinue).Value
    $p = (Get-Item env:ACR_PASSWORD -ErrorAction SilentlyContinue).Value
    if ($u -and $p) {
        Write-Host "==> docker login $ACR_REGISTRY"
        $p | docker login $ACR_REGISTRY --username $u --password-stdin
    } else {
        Write-Host '==> 未设置 ACR_USERNAME/ACR_PASSWORD，假设已 docker login'
    }
    Write-Host '==> 打标签并推送...'
    docker tag "robot-op-api:$IMAGE_TAG" "${API_IMAGE}:$IMAGE_TAG"
    docker tag "robot-op-frontend:$IMAGE_TAG" "${FE_IMAGE}:$IMAGE_TAG"
    docker push "${API_IMAGE}:$IMAGE_TAG"
    docker push "${FE_IMAGE}:$IMAGE_TAG"
} else {
    Write-Host '==> 跳过推送 (SKIP_PUSH=1)'
}

if (Test-Path -LiteralPath $TmpK) { Remove-Item -Recurse -Force $TmpK }
New-Item -ItemType Directory -Path $TmpK | Out-Null

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
function Write-Utf8NoBom($Path, $Content) {
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

if ($WITH_PULL_SECRET -eq '1') {
    $u = (Get-Item env:ACR_USERNAME -ErrorAction SilentlyContinue).Value
    $p = (Get-Item env:ACR_PASSWORD -ErrorAction SilentlyContinue).Value
    if (-not $u -or -not $p) {
        Write-Host 'WITH_PULL_SECRET=1 时需要 ACR_USERNAME 与 ACR_PASSWORD'
        exit 1
    }
    Write-Host '==> 创建命名空间与拉镜像 Secret'
    kubectl create namespace robot-op-center --dry-run=client -o yaml | kubectl apply -f -
    kubectl create secret docker-registry acr-regcred `
        --docker-server=$ACR_REGISTRY `
        --docker-username=$u `
        --docker-password=$p `
        --namespace=robot-op-center `
        --dry-run=client -o yaml | kubectl apply -f -

    $kust = @"
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
    newName: $API_IMAGE
    newTag: "$IMAGE_TAG"
  - name: robot-op-frontend
    newName: $FE_IMAGE
    newTag: "$IMAGE_TAG"
"@
    Write-Utf8NoBom (Join-Path $TmpK 'kustomization.yaml') $kust

    $patchApi = @'
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
'@
    $patchFe = @'
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
'@
    Write-Utf8NoBom (Join-Path $TmpK 'pull-secret-api.yaml') $patchApi
    Write-Utf8NoBom (Join-Path $TmpK 'pull-secret-frontend.yaml') $patchFe
} else {
    $kust = @"
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: robot-op-center
resources:
  - ../base/namespace.yaml
  - ../base/api.yaml
  - ../base/frontend.yaml
images:
  - name: robot-op-api
    newName: $API_IMAGE
    newTag: "$IMAGE_TAG"
  - name: robot-op-frontend
    newName: $FE_IMAGE
    newTag: "$IMAGE_TAG"
"@
    Write-Utf8NoBom (Join-Path $TmpK 'kustomization.yaml') $kust
}

if ($SKIP_APPLY -ne '1') {
    Write-Host "==> kubectl apply -k $TmpK"
    kubectl apply -k $TmpK
    Write-Host ''
    Write-Host '完成。查看: kubectl get pods -n robot-op-center -w'
    Write-Host '访问: kubectl get svc robot-op-frontend -n robot-op-center'
} else {
    Write-Host "==> 跳过 kubectl (SKIP_APPLY=1)，临时目录: $TmpK"
}
