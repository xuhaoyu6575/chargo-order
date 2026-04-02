# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(__file__).resolve().parent / "cloud_API_doc.md"
text = p.read_text(encoding="utf-8")

repls = [
    (
        """## API 接口清单

云平台需要提供以下 3 个核心数据接口：

| 接口名称 | 接口路径 | 请求方法 | 说明 |
|---------|---------|---------|------|
| 获取站点列表 | `/api/sites` | GET | 返回所有运营站点的基本信息 |
| 获取订单列表 | `/api/orders` | GET | 返回所有充电订单的原始记录 |
| 获取充电车状态列表 | `/api/robots` | GET | 返回所有充电车的当前状态 |""",
        """## API 接口清单

以下 **接口名、路径、HTTP 方法、请求体字段** 与开放平台说明 **3.2 / 3.3 / 3.4** 截图一致。**响应体**统一为本文 **「统一返回格式」**（`Result`：`code`、`success`、`msg`、`msgDetail`、`data`、`timestamp`）。**`data` 形态**：推荐为 **当页记录数组**；若平台返回分页包装 `{"list": [], "total": N, ...}`，运营中心 `CloudApiClientImpl` 亦支持从 `data.list` 取值。

| 章节 | 接口名称 | 接口路径 | 请求方法 | 说明 |
|------|---------|---------|---------|------|
| 3.2 | 分页查询站点列表 | `/api/sites` | POST | JSON Body：`merchantId`、`siteId`、`pageNo`、`pageSize` |
| 3.3 | 分页查询充电车状态列表 | `/api/robots` | POST | JSON Body：`merchantId`、`siteId`、`pageNo`、`pageSize` |
| 3.4 | 分页查询获取订单列表 | `/api/orders` | POST | JSON Body：上述四项 + `beginDate`、`endDate` |""",
    ),
    (
        """### 1. 获取站点列表

#### 接口信息
- **接口路径**: `/api/sites`
- **请求方法**: `GET`
- **接口说明**: 获取所有运营站点（充电服务区域）的基本信息，用于 Dashboard 站点筛选和数据下钻

#### 请求参数
无（返回全量站点数据）

#### 响应格式

**HTTP 状态码**: `200 OK`

**响应体**: 统一返回格式 `Result<List<SiteRecord>>`""",
        """### 3.2 分页查询站点列表

#### 接口信息
- **接口路径**: `/api/sites`
- **请求方法**: `POST`
- **Content-Type**: `application/json;charset=UTF-8`
- **接口说明**: 分页查询站点列表，用于 Dashboard 站点筛选和数据下钻

#### 请求报文参数（JSON Body）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `merchantId` | Long | 视平台规则 | 商户标识 |
| `siteId` | String | 否 | 指定站点；不传或空表示不按站点过滤 |
| `pageNo` | Integer | 是 | 页码，从 1 开始 |
| `pageSize` | Integer | 是 | 每页条数 |

#### 请求示例

```json
{
  "merchantId": 1034,
  "siteId": "",
  "pageNo": 1,
  "pageSize": 100
}
```

#### 响应格式

**HTTP 状态码**: `200 OK`

**响应体**: 统一返回格式 `Result<List<SiteRecord>>`（当页站点列表）""",
    ),
    (
        """### 2. 获取订单列表

#### 接口信息
- **接口路径**: `/api/orders`
- **请求方法**: `GET`
- **接口说明**: 获取充电订单的完整历史记录，用于运营分析和统计

#### 请求参数
无（返回全量订单数据）

#### 响应格式

**HTTP 状态码**: `200 OK`

**响应体**: 统一返回格式 `Result<List<OrderRecord>>`""",
        """### 3.4 分页查询获取订单列表

#### 接口信息
- **接口路径**: `/api/orders`
- **请求方法**: `POST`
- **Content-Type**: `application/json;charset=UTF-8`
- **接口说明**: 分页查询订单列表，用于运营分析与统计

#### 请求报文参数（JSON Body）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `merchantId` | Long | 视平台规则 | 商户标识 |
| `siteId` | String | 否 | 指定站点；不传或空表示不按站点过滤 |
| `pageNo` | Integer | 是 | 页码，从 1 开始 |
| `pageSize` | Integer | 是 | 每页条数 |
| `beginDate` | String | 视业务 | 查询起始日期，建议 `yyyy-MM-dd` |
| `endDate` | String | 视业务 | 查询结束日期，建议 `yyyy-MM-dd` |

#### 请求示例

```json
{
  "merchantId": 1034,
  "siteId": "",
  "pageNo": 1,
  "pageSize": 500,
  "beginDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

#### 响应格式

**HTTP 状态码**: `200 OK`

**响应体**: 统一返回格式 `Result<List<OrderRecord>>`（当页订单列表）""",
    ),
    (
        """### 3. 获取充电车状态列表

#### 接口信息
- **接口路径**: `/api/robots`
- **请求方法**: `GET`
- **接口说明**: 获取所有充电车的当前运营状态

#### 请求参数
无（返回全量充电车数据）

#### 响应格式

**HTTP 状态码**: `200 OK`

**响应体**: 统一返回格式 `Result<List<RobotRecord>>`""",
        """### 3.3 分页查询充电车状态列表

#### 接口信息
- **接口路径**: `/api/robots`
- **请求方法**: `POST`
- **Content-Type**: `application/json;charset=UTF-8`
- **接口说明**: 分页查询充电车状态列表（响应 `data` 中含 `vin` 等字段）

#### 请求报文参数（JSON Body）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `merchantId` | Long | 视平台规则 | 商户标识 |
| `siteId` | String | 否 | 指定站点；不传或空表示不按站点过滤 |
| `pageNo` | Integer | 是 | 页码，从 1 开始 |
| `pageSize` | Integer | 是 | 每页条数 |

#### 请求示例

```json
{
  "merchantId": 1034,
  "siteId": "",
  "pageNo": 1,
  "pageSize": 200
}
```

#### 响应格式

**HTTP 状态码**: `200 OK`

**响应体**: 统一返回格式 `Result<List<RobotRecord>>`（当页车辆列表）""",
    ),
    (
        "2. **数据完整性**：所有字段不允许 `null` 值；必须包含所有已开通的站点",
        "2. **数据完整性**：所有字段不允许 `null` 值；全量站点由调用方递增 `pageNo` 分页拉取后合并",
    ),
    (
        "1. **时间槽计算规则**：",
        "4. **分页拉取**：Dashboard 后端需按 `pageNo` 循环请求直至当页条数小于 `pageSize`（或按平台约定）以覆盖统计所需时间范围。\n\n1. **时间槽计算规则**：",
    ),
    (
        """2. **数据完整性**：
   - 所有字段必须提供，不允许 `null` 值
   - 数值类型字段不能为负数
   - `daysAgo` 范围：0-29（建议至少提供最近 30 天的数据）
   - `dayOfWeek` 范围：0-6
   - `timeSlot` 范围：0-47""",
        """2. **数据完整性**：
   - 所有字段必须提供，不允许 `null` 值
   - 数值类型字段不能为负数
   - `daysAgo` 范围：0-29（建议至少提供最近 30 天的数据）
   - `dayOfWeek` 范围：0-6
   - `timeSlot` 范围：0-47
   - 全量订单由调用方按 `beginDate`/`endDate` 与分页参数多次请求后合并""",
    ),
    (
        """3. **数据完整性**：
   - 所有字段必须提供，不允许 `null` 值
   - 必须包含所有已注册的充电车（包括离线设备）""",
        """3. **数据完整性**：
   - 所有字段必须提供，不允许 `null` 值
   - 全量车辆由调用方递增 `pageNo` 分页拉取后合并（含离线设备）""",
    ),
    (
        """### 1. 认证方式

**推荐方式**：API Key 认证

```http
GET /api/orders HTTP/1.1
Host: cloud-platform.example.com
Authorization: Bearer YOUR_API_KEY
```

或使用自定义 Header：

```http
GET /api/orders HTTP/1.1
Host: cloud-platform.example.com
X-API-Key: YOUR_API_KEY
```""",
        """### 1. 认证方式

接口为 **POST**，请求体为 JSON，与开放平台截图一致。认证可采用以下之一（以云平台实际开放能力为准）：

**方式 A：Bearer / API Key（示例）**

```http
POST /api/orders HTTP/1.1
Host: cloud-platform.example.com
Content-Type: application/json;charset=UTF-8
Authorization: Bearer YOUR_API_KEY

{"merchantId":1034,"siteId":"","pageNo":1,"pageSize":500,"beginDate":"2025-01-01","endDate":"2025-01-31"}
```

**方式 B：开放平台 Header 鉴权**（如 `appKey`、`timestamp`、`lmt-auth-token` 等）——工程内见 `CloudAuthService` 与 `CloudApiClientImpl`。

或使用自定义 Header 携带 Key：

```http
POST /api/orders HTTP/1.1
Host: cloud-platform.example.com
Content-Type: application/json;charset=UTF-8
X-API-Key: YOUR_API_KEY
```""",
    ),
    (
        "- **数据量**：单次请求返回的订单数据建议不超过 10,000 条",
        "- **数据量**：单次分页 `pageSize` 建议 200～1000；大日期范围通过多页合并",
    ),
    (
        "  - Dashboard 后端通过订单和充电车记录中的 `siteId` 字段完成过滤，无需云平台提供带参数的筛选接口",
        "  - 列表类接口请求体中的 `siteId` 可用于云平台侧过滤；图表模块仍按返回记录中的 `siteId` 与页面所选站点做二次过滤",
    ),
]

for i, (old, new) in enumerate(repls):
    if old not in text:
        raise SystemExit(f"BLOCK {i} NOT FOUND:\n{old[:200]}")
    text = text.replace(old, new, 1)

p.write_text(text, encoding="utf-8")
print("OK", p.stat().st_size)
