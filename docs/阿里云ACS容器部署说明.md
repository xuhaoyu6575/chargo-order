# 傻瓜式部署：运营中心上阿里云 ACS（按顺序做即可）

把 **前端 + 后端** 两个镜像推到阿里云，再用 **kubectl** 一键部署到 ACS 集群。下面每一步做完再点下一步。

---

## 最快：一键部署（3 步）

1. **复制配置**  
   - Windows：`copy deploy\deploy.env.example deploy\deploy.env`  
   - Mac/Linux/CloudShell：`cp deploy/deploy.env.example deploy/deploy.env`  
2. **编辑 `deploy/deploy.env`**：至少填写 **`ACR_REGISTRY`**、**`ACR_NAMESPACE`**、**`IMAGE_TAG`**。  
   - 镜像仓库是**私有**时：把 **`WITH_PULL_SECRET=1`**，并填写 **`ACR_USERNAME`**、**`ACR_PASSWORD`**（脚本会自动 `docker login`、在集群里创建 `acr-regcred` 并给两个 Deployment 打上拉镜像配置）。  
   - 公有仓库或你已自己建好 Secret：保持 **`WITH_PULL_SECRET=0`**，并自行保证节点能拉镜像。  
3. **在项目根目录执行**（先 `kubectl` 已连上 ACS）：  
   - Windows（PowerShell）：`.\deploy\deploy-to-acs.ps1`  
   - Mac/Linux/阿里云 CloudShell：`bash deploy/deploy-to-acs.sh`  

脚本会依次：**构建两个 Docker 镜像 → 推送 ACR → `kubectl apply` 部署**。完成后执行：

```bash
kubectl get pods -n robot-op-center -w
kubectl get svc robot-op-frontend -n robot-op-center
```

浏览器访问 **frontend** 的 **EXTERNAL-IP**（80 端口）。

**可选环境变量**（一般不用）：`SKIP_BUILD=1` 跳过构建、`SKIP_PUSH=1` 跳过推送、`SKIP_APPLY=1` 只生成临时清单不执行 kubectl。`deploy.env` 已加入 `.gitignore`，勿把密码提交到 Git。

下面为**手动逐步**说明，与脚本做同一件事，供排查或学习用。

---

## 开始前：先确认这 5 件事

| 序号 | 你要有 |
|------|--------|
| ① | 阿里云已开通 **ACS**，并且已经有一个 **可用的集群** |
| ② | 已安装 **容器镜像服务 ACR**，记下登录地址（形如 `registry.cn-hangzhou.aliyuncs.com`） |
| ③ | 在 ACR 里建好 **一个命名空间**（下面用 `你的ACR命名空间` 代替） |
| ④ | 在 ACR 里建好 **两个镜像仓库**：`robot-op-api`、`robot-op-frontend` |
| ⑤ | 本机能用 **kubectl** 连上集群（或直接用阿里云 **CloudShell**，里面自带 kubectl） |

> 不会连集群？到 **ACS 控制台 → 集群详情 → 连接信息**，下载 kubeconfig 或点 **CloudShell**。

---

## 第 1 步：填一张「小抄」（后面命令都要用）

拿纸或记事本，把下面三项改成你自己的，**全文保持一致**：

```
地域简写（region）     例：hangzhou
ACR 登录域名           例：registry.cn-hangzhou.aliyuncs.com
ACR 命名空间           例：mycompany
镜像版本号             例：1.0.0（自己定，别带中文）
```

下面命令里出现的：

- `registry.cn-hangzhou.aliyuncs.com` → 换成你的 **ACR 登录域名**
- `你的ACR命名空间` → 换成你的 **ACR 命名空间**
- `1.0.0` → 换成你的 **版本号**

---

## 第 2 步：进入代码根目录

代码要包含文件夹 `robot_op_center_frontend` 和 `robot_op_center_springboot_v1`。

**Windows（PowerShell）示例：**

```powershell
cd f:\chargo_order
```

**Linux / Mac / CloudShell 示例：**

```bash
cd /path/to/chargo_order
```

---

## 第 3 步：打包两个 Docker 镜像

仍在**项目根目录**执行：

```bash
docker build -t robot-op-api:1.0.0 ./robot_op_center_springboot_v1
docker build -t robot-op-frontend:1.0.0 ./robot_op_center_frontend
```

两条都显示 **Successfully** 再继续。

---

## 第 4 步：登录阿里云镜像仓库（ACR）

```bash
docker login registry.cn-hangzhou.aliyuncs.com
```

按提示输入 ACR 的用户名、密码（在 **ACR 控制台 → 访问凭证** 里看）。

---

## 第 5 步：给镜像打「阿里云地址」并推送

把下面命令里的 **域名、命名空间、版本号** 换成你在第 1 步写的小抄：

```bash
docker tag robot-op-api:1.0.0 registry.cn-hangzhou.aliyuncs.com/你的ACR命名空间/robot-op-api:1.0.0
docker tag robot-op-frontend:1.0.0 registry.cn-hangzhou.aliyuncs.com/你的ACR命名空间/robot-op-frontend:1.0.0

docker push registry.cn-hangzhou.aliyuncs.com/你的ACR命名空间/robot-op-api:1.0.0
docker push registry.cn-hangzhou.aliyuncs.com/你的ACR命名空间/robot-op-frontend:1.0.0
```

四条 push 都成功再继续。

---

## 第 6 步：改一行配置（告诉 K8s 用哪两个镜像）

用编辑器打开本仓库里的文件：

`deploy/k8s/base/kustomization.yaml`

把 `images:` 下面两段改成**你刚推送的完整地址**（和第 5 步一致），例如：

```yaml
images:
  - name: robot-op-api
    newName: registry.cn-hangzhou.aliyuncs.com/你的ACR命名空间/robot-op-api
    newTag: "1.0.0"
  - name: robot-op-frontend
    newName: registry.cn-hangzhou.aliyuncs.com/你的ACR命名空间/robot-op-frontend
    newTag: "1.0.0"
```

保存文件。

---

## 第 7 步：（仅第一次）让集群能拉你的私有镜像

> 若已用 **一键脚本** 且 **`WITH_PULL_SECRET=1`**，可**跳过本步**。

ACR 若是**私有仓库**，必须在集群里建拉镜像密码（只做一次）：

```bash
kubectl create namespace robot-op-center

kubectl create secret docker-registry acr-regcred \
  --docker-server=registry.cn-hangzhou.aliyuncs.com \
  --docker-username=你的ACR用户名 \
  --docker-password=你的ACR密码 \
  --namespace=robot-op-center
```

然后打开下面两个文件，**删掉** `imagePullSecrets` 两行前面的 `#`（取消注释），保存：

- `deploy/k8s/base/api.yaml`
- `deploy/k8s/base/frontend.yaml`

找到类似下面这一段，改成**没有**行首 `#`：

```yaml
      imagePullSecrets:
        - name: acr-regcred
```

> ACR 若是**公开可读**，可跳过第 7 步整步。

---

## 第 8 步：一键部署到 ACS

仍在**项目根目录**（和 `deploy` 文件夹同级）执行：

```bash
kubectl apply -k deploy/k8s/base
```

看到 `created` 或 `configured` 即正常。

---

## 第 9 步：等 Pod 变绿

```bash
kubectl get pods -n robot-op-center -w
```

两个 Deployment 下面的 Pod 都是 **Running** 且 **READY 1/1**（或 2/2）后，按 `Ctrl+C` 结束监视。

若一直 **ImagePullBackOff**：检查第 7 步 Secret、`imagePullSecrets`、镜像地址是否写错。

---

## 第 10 步：拿网址，浏览器打开

```bash
kubectl get svc -n robot-op-center
```

找到 **`robot-op-frontend`** 这一行，看 **EXTERNAL-IP**（外网 IP）或控制台里显示的 **负载均衡地址**。

浏览器访问：`http://外网IP`（默认 **80** 端口）

能打开页面、图表能加载，即部署成功。

---

## 第 11 步（可选）：接真实云平台（默认是 Mock 演示数据）

默认 **`deploy/k8s/base/api.yaml`** 里 **`CLOUD_API_MOCK` 为 `"true"`**，不配置云平台也能先看到页面。

若要**真连云平台**：

1. 编辑 `deploy/k8s/base/api.yaml`：把 `CLOUD_API_BASE_URL` 改成真实云地址；把 `CLOUD_API_MOCK` 改成 `"false"`。
2. 复制 `deploy/k8s/examples/cloud-credentials-secret.example.yaml` 为本地文件（**不要提交 Git**），填入 AK/SK，执行：  
   `kubectl apply -f 你的secret文件.yaml`
3. 再执行：  
   `kubectl apply -k deploy/k8s/base`

---

## 附：只想本机先跑通（不上云）

在项目根目录：

```bash
docker compose up -d
```

浏览器打开：`http://localhost:3000`

---

## 附：想更正规一点（域名 + HTTPS）

把前端 Service 改成 **ClusterIP**，再用 **Ingress**（如 ALB）。示例骨架见：`deploy/k8s/examples/ingress-alb.example.yaml`，注解以你当前地域 **阿里云文档**为准。

---

## 附：官方帮助链接

- [ACS 用 kubectl 快速部署](https://help.aliyun.com/zh/cs/use-acs-quickly-through-kubectl)  
- [创建 ACS 集群](https://www.alibabacloud.com/help/zh/cs/user-guide/create-an-acs-cluster)  
- [ACR 帮助](https://help.aliyun.com/zh/acr/)

---

**文档版本**：2.0（傻瓜步骤版）
