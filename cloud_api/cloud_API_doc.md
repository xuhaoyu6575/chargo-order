# 移动储能充电车运营中心 - 云平台 API 对接需求文档

## 文档概述

本文档定义了移动储能充电车运营中心 Dashboard 后端系统所需的云平台原始数据接口规范。Dashboard 系统通过调用云平台提供的 API 获取订单和充电车数据，用于生成运营分析报表。

**目标云平台**：充电服务云平台
**对接方式**：RESTful API (HTTP/HTTPS)
**数据格式**：JSON
**字符编码**：UTF-8

---

## API 接口清单

云平台需提供 **3 个核心原始数据接口**（Dashboard 统计用），以及 **1 个营收驾驶舱聚合接口**（**营收/应收数据**）。  
**元数据**（开放平台字段与驾驶舱结构的对应关系、聚合口径、坐标含义等）**不单独提供 HTTP 枚举/字典接口**，以本文档 **附录 B** 的说明为准（与此前「随文档约定」的方式一致）。

| 接口名称 | 接口路径 | 请求方法 | 说明 |
|---------|---------|---------|------|
| 获取站点列表 | `/api/sites` | GET | 返回所有运营站点的基本信息 |
| 获取订单列表 | `/api/orders` | GET | 返回所有充电订单的原始记录 |
| 获取充电车状态列表 | `/api/robots` | GET | 返回所有充电车的当前状态 |
| **营收驾驶舱聚合数据** | `/api/revenue/cockpit` | GET | 按 **站点** 与 **时间范围** 返回总营收、客单价、订单数、趋势、业务占比、TOP 站点、热力图等（可与运营中心基于 `/api/orders` 本地聚合二选一） |

---

### 营收驾驶舱：`/api/revenue/cockpit` 查询参数

| 参数名 | 位置 | 必填 | 说明 |
|--------|------|------|------|
| `siteId` | Query | 否 | 站点 ID，与 `/api/sites` 的 `id` 一致；**不传或空字符串表示全部站点** |
| `preset` | Query | 否 | 时间范围快捷档位，与运营中心一致：`today` / `yesterday` / `7d` / `30d` / `mtd` |
| `beginDate` | Query | 否 | 自定义区间起始 `yyyy-MM-dd`；与 `endDate` 成对使用。**若与 `preset` 同时出现，建议以日期区间为准**（或由云平台书面约定优先级） |
| `endDate` | Query | 否 | 自定义区间结束 `yyyy-MM-dd`；须 `endDate >= beginDate` |

**示例**：

```http
GET /api/revenue/cockpit?siteId=SITE001&preset=7d
GET /api/revenue/cockpit?beginDate=2026-03-01&endDate=2026-03-31
```

---

## 接口详细规范

### 1. 获取站点列表

#### 接口信息
- **接口路径**: `/api/sites`
- **请求方法**: `GET`
- **接口说明**: 获取所有运营站点（充电服务区域）的基本信息，用于 Dashboard 站点筛选和数据下钻

#### 请求参数
无（返回全量站点数据）

#### 响应格式

**HTTP 状态码**: `200 OK`

**响应体**: 统一返回格式 `Result<List<SiteRecord>>`

```json
{
  "code": 200,
  "success": true,
  "msg": "操作成功",
  "msgDetail": null,
  "data": [
    {
      "id": "string",
      "name": "string"
    }
  ],
  "timestamp": 1709712000000
}
```

#### 站点数据字段说明 (data 数组中的元素)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|-------|------|------|------|--------|
| `id` | String | 是 | 站点唯一标识符 | `"SITE001"` |
| `name` | String | 是 | 站点名称（对人可读的展示名） | `"深圳南山充电站"` |

#### 数据要求

1. **ID 唯一性**：`id` 必须全局唯一，与订单及充电车记录中的 `siteId` 保持一致
2. **数据完整性**：所有字段不允许 `null` 值；必须包含所有已开通的站点
3. **排序**：建议按站点名称或编号升序排列

#### 成功响应示例

```json
{
  "code": 200,
  "success": true,
  "msg": "操作成功",
  "msgDetail": null,
  "data": [
    { "id": "SITE001", "name": "深圳南山充电站" },
    { "id": "SITE002", "name": "深圳宝安充电站" },
    { "id": "SITE003", "name": "广州天河充电站" }
  ],
  "timestamp": 1709712000000
}
```

---

### 2. 获取订单列表

#### 接口信息
- **接口路径**: `/api/orders`
- **请求方法**: `GET`
- **接口说明**: 获取充电订单的完整历史记录，用于运营分析和统计

#### 请求参数
无（返回全量订单数据）

#### 响应格式

**HTTP 状态码**: `200 OK`

**响应体**: 统一返回格式 `Result<List<OrderRecord>>`

```json
{
  "code": 200,
  "success": true,
  "msg": "操作成功",
  "msgDetail": null,
  "data": [
    {
      "orderId": "string",
      "siteId": "string",
      "daysAgo": 0,
      "dayOfWeek": 0,
      "timeSlot": 0,
      "endReason": "string",
      "estimatedKwh": 0.0,
      "actualKwh": 0.0,
      "userId": "string",
      "responseMinutes": 0,
      "travelMinutes": 0,
      "plugInMinutes": 0,
      "chargeMinutes": 0,
      "plugOutMinutes": 0,
      "cancelMinutes": 0
    }
  ],
  "timestamp": 1709712000000
}
```

#### 统一返回格式字段说明

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|-------|------|------|------|--------|
| `code` | Integer | 是 | 状态码：200=成功，500=服务端异常，4xx=客户端异常 | `200` |
| `success` | Boolean | 是 | 是否成功 | `true` |
| `msg` | String | 是 | 提示信息 | `"操作成功"` |
| `msgDetail` | String | 否 | 详细错误信息（仅失败时有值） | `null` |
| `data` | Array | 是 | 业务数据：订单记录列表 | `[...]` |
| `timestamp` | Long | 是 | 时间戳（毫秒） | `1709712000000` |

#### 订单数据字段说明 (data 数组中的元素)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|-------|------|------|------|--------|
| `orderId` | String | 是 | 订单唯一标识符 | `"ORD20240306001"` |
| `siteId` | String | 是 | 所属站点标识符，与 `/api/sites` 中的 `id` 对应 | `"SITE001"` |
| `daysAgo` | Integer | 是 | 距今天数：0=今天，1=昨天，…，29=30天前。<br>Dashboard 后端按此字段做"最近 N 天"时间范围过滤 | `0` |
| `dayOfWeek` | Integer | 是 | 星期几：0=周一, 1=周二, ..., 6=周日 | `2` (周三) |
| `timeSlot` | Integer | 是 | 一天内的半小时时间槽：<br>0=00:00, 1=00:30, ..., 47=23:30 | `17` (08:30) |
| `endReason` | String | 是 | 订单结束原因编码，见下表 | `"NORMAL"` |
| `estimatedKwh` | Double | 是 | 下单时预估充电量（千瓦时） | `35.5` |
| `actualKwh` | Double | 是 | 实际充电量（千瓦时） | `38.2` |
| `userId` | String | 是 | 用户唯一标识符 | `"U001"` |
| `responseMinutes` | Integer | 是 | 响应耗时：从下单到派单的分钟数 | `2` |
| `travelMinutes` | Integer | 是 | 行驶耗时：从派单到到达的分钟数 | `5` |
| `plugInMinutes` | Integer | 是 | 插枪耗时：从到达到插枪完成的分钟数 | `3` |
| `chargeMinutes` | Integer | 是 | 充电耗时：从插枪到充电完成的分钟数 | `45` |
| `plugOutMinutes` | Integer | 是 | 拔枪耗时：从充电完成到拔枪的分钟数 | `2` |
| `cancelMinutes` | Integer | 是 | 取消等待时长：非正常结束时，取消前已等待的分钟数<br>正常结束时为 0 | `0` |

#### 结束原因编码 (endReason)

| 编码 | 说明 | 业务含义 |
|------|------|---------|
| `NORMAL` | 正常结束 | 充电服务正常完成 |
| `USER_CANCEL` | 用户取消 | 用户主动取消订单 |
| `ROBOT_FAILURE` | 机器人故障 | 机器人设备故障导致服务中断 |
| `VEHICLE_FULL` | 车辆满电结束 | 车辆电池已充满，提前结束 |
| `OPS_FORCE` | 运营强制结束 | 运营人员手动终止订单 |
| `OTHER` | 其他异常 | 其他未分类的异常情况 |

#### 数据要求

1. **时间槽计算规则**：
   - `timeSlot` 值范围：0-47
   - 计算公式：`timeSlot = hour * 2 + (minute >= 30 ? 1 : 0)`
   - 示例：08:30 → `timeSlot = 8 * 2 + 1 = 17`

2. **数据完整性**：
   - 所有字段必须提供，不允许 `null` 值
   - 数值类型字段不能为负数
   - `daysAgo` 范围：0-29（建议至少提供最近 30 天的数据）
   - `dayOfWeek` 范围：0-6
   - `timeSlot` 范围：0-47

3. **数据精度**：
   - `estimatedKwh` 和 `actualKwh` 保留 2 位小数
   - 时间字段单位统一为分钟（整数）

#### 成功响应示例

```json
{
  "code": 200,
  "success": true,
  "msg": "操作成功",
  "msgDetail": null,
  "data": [
    {
      "orderId": "550e8400-e29b-41d4-a716-446655440000",
      "siteId": "SITE001",
      "daysAgo": 0,
      "dayOfWeek": 2,
      "timeSlot": 17,
      "endReason": "NORMAL",
      "estimatedKwh": 35.50,
      "actualKwh": 38.20,
      "userId": "U001",
      "responseMinutes": 2,
      "travelMinutes": 5,
      "plugInMinutes": 3,
      "chargeMinutes": 45,
      "plugOutMinutes": 2,
      "cancelMinutes": 0
    },
    {
      "orderId": "660e8400-e29b-41d4-a716-446655440001",
      "siteId": "SITE002",
      "daysAgo": 3,
      "dayOfWeek": 4,
      "timeSlot": 32,
      "endReason": "USER_CANCEL",
      "estimatedKwh": 42.00,
      "actualKwh": 8.50,
      "userId": "U125",
      "responseMinutes": 3,
      "travelMinutes": 7,
      "plugInMinutes": 4,
      "chargeMinutes": 15,
      "plugOutMinutes": 2,
      "cancelMinutes": 12
    }
  ],
  "timestamp": 1709712000000
}
```

---

### 3. 获取充电车状态列表

#### 接口信息
- **接口路径**: `/api/robots`
- **请求方法**: `GET`
- **接口说明**: 获取所有充电车的当前运营状态

#### 请求参数
无（返回全量充电车数据）

#### 响应格式

**HTTP 状态码**: `200 OK`

**响应体**: 统一返回格式 `Result<List<RobotRecord>>`

```json
{
  "code": 200,
  "success": true,
  "msg": "操作成功",
  "msgDetail": null,
  "data": [
    {
      "vin": "string",
      "siteId": "string",
      "active": true
    }
  ],
  "timestamp": 1709712000000
}
```

#### 统一返回格式字段说明

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|-------|------|------|------|--------|
| `code` | Integer | 是 | 状态码：200=成功，500=服务端异常，4xx=客户端异常 | `200` |
| `success` | Boolean | 是 | 是否成功 | `true` |
| `msg` | String | 是 | 提示信息 | `"操作成功"` |
| `msgDetail` | String | 否 | 详细错误信息（仅失败时有值） | `null` |
| `data` | Array | 是 | 业务数据：充电车状态列表 | `[...]` |
| `timestamp` | Long | 是 | 时间戳（毫秒） | `1709712000000` |

#### 充电车数据字段说明 (data 数组中的元素)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|-------|------|------|------|--------|
| `vin` | String | 是 | 车辆识别码（Vehicle Identification Number），17位字符 | `"LCHGEV00000000001"` |
| `siteId` | String | 是 | 所属站点标识符，与 `/api/sites` 中的 `id` 对应 | `"SITE001"` |
| `active` | Boolean | 是 | 运营状态：<br>`true` = 运营中（活跃）<br>`false` = 离线/维护 | `true` |

#### 数据要求

1. **VIN 格式规范**：
   - 标准 VIN 码为 17 位字符（数字和大写字母，不含 I、O、Q）
   - 示例格式：`LCHGEV00000000001`（L=中国，CHGEV=充电车型代码）
   - 必须全局唯一，不可重复

2. **状态定义**：
   - `active = true`：充电车在线且可接单
   - `active = false`：充电车离线、维护中或不可用

3. **数据完整性**：
   - 所有字段必须提供，不允许 `null` 值
   - 必须包含所有已注册的充电车（包括离线设备）

#### 成功响应示例

```json
{
  "code": 200,
  "success": true,
  "msg": "操作成功",
  "msgDetail": null,
  "data": [
    {
      "vin": "LCHGEV00000000001",
      "siteId": "SITE001",
      "active": true
    },
    {
      "vin": "LCHGEV00000000002",
      "siteId": "SITE001",
      "active": true
    },
    {
      "vin": "LCHGEV00000000003",
      "siteId": "SITE002",
      "active": false
    },
    {
      "vin": "LCHGEV00000000004",
      "siteId": "SITE002",
      "active": true
    }
  ],
  "timestamp": 1709712000000
}
```

---

### 4. 营收驾驶舱聚合数据（营收/应收）

#### 接口信息

- **接口路径**: `/api/revenue/cockpit`
- **请求方法**: `GET`
- **接口说明**: 由云平台在服务端按 **站点**、**时间范围** 完成营收聚合，返回驾驶舱所需指标与图表数据；运营中心亦可拉取 `/api/orders` 后自行聚合，二者 **二选一**。  
  **必须支持** `siteId` 与 **时间范围**（`preset` 或 `beginDate`+`endDate`）。  
  **字段含义、与开放平台原始字段的对应及聚合口径** 见 **附录 B**（不要求单独的元数据/枚举类 HTTP 接口）。

#### 请求参数

| 参数名 | 必填 | 说明 |
|--------|------|------|
| `siteId` | 否 | 站点；不传为全部站点汇总 |
| `preset` | 否 | 默认建议 `30d`（与运营中心 `RevenueController` 默认一致） |
| `beginDate` | 否 | 自定义区间起始 `yyyy-MM-dd` |
| `endDate` | 否 | 自定义区间结束 `yyyy-MM-dd` |

#### 响应格式

**HTTP 状态码**: `200 OK`  

**响应体**: 统一 `Result<RevenueCockpitVO>`，字段需与运营中心前端约定一致：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `totalRevenue` | Number | 区间内总营收 |
| `avgOrderValue` | Number | 客单价（区间内） |
| `orderCount` | Integer | 订单数 |
| `trend` | Array | 趋势点列表，如 `{ "dateLabel": "3月1日", "revenue": 12000.0 }` |
| `businessMix` | Array | 业务占比，如 `{ "name": "送电", "value": 176275.0 }` |
| `topSites` | Array | TOP 站点，如 `{ "name": "港城广场", "revenue": 58273.21 }`（`siteId` 已指定时可返回单站或相对排名） |
| `heatmap` | Array | 热力图单元，建议为 `[星期索引 0–6, 小时 0–23, 强度]`（与附录 B 说明一致） |
| `heatmapDayLabels` | Array of String | 星期标签，如 `Mon`…`Sun` |

```json
{
  "code": 200,
  "success": true,
  "msg": "操作成功",
  "msgDetail": null,
  "data": {
    "totalRevenue": 320500.0,
    "avgOrderValue": 105.5,
    "orderCount": 3038,
    "trend": [
      { "dateLabel": "3月1日", "revenue": 12000.0 }
    ],
    "businessMix": [
      { "name": "送电", "value": 176275.0 }
    ],
    "topSites": [
      { "name": "港城广场", "revenue": 58273.21 }
    ],
    "heatmap": [[0, 0, 7], [0, 1, 6]],
    "heatmapDayLabels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  },
  "timestamp": 1709712000000
}
```

#### 数据要求

1. 时间边界与 `preset` / `beginDate`+`endDate` 语义须与 **附录 B** 及开放平台订单时间字段一致（时区、闭区间/开区间需写明）。
2. `siteId` 有值时，所有指标仅统计该站点；无值时统计全平台或租户可见范围（与开放平台权限模型一致）。

---

## 通用规范

### 1. 认证方式

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
```

### 2. 错误响应

当请求失败时，返回统一错误格式：

```json
{
  "code": 500,
  "success": false,
  "msg": "服务器内部错误",
  "msgDetail": "详细错误堆栈信息或错误原因描述",
  "data": null,
  "timestamp": 1709712000000
}
```

**错误响应字段说明**：

| 字段名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `code` | Integer | 是 | 错误状态码，见下表 |
| `success` | Boolean | 是 | 固定为 `false` |
| `msg` | String | 是 | 错误提示信息（面向用户） |
| `msgDetail` | String | 否 | 详细错误信息（用于调试，可选） |
| `data` | null | 是 | 失败时固定为 `null` |
| `timestamp` | Long | 是 | 时间戳（毫秒） |

**常见错误码**：

| HTTP 状态码 | code 值 | msg 示例 | 说明 |
|------------|---------|---------|------|
| 401 | 401 | `"认证失败"` | API Key 无效或未提供 |
| 403 | 403 | `"无权限访问"` | 无权限访问该资源 |
| 404 | 404 | `"接口不存在"` | 接口路径不存在 |
| 500 | 500 | `"服务器内部错误"` | 服务器内部错误 |
| 503 | 503 | `"服务暂时不可用"` | 服务暂时不可用 |

**错误响应示例**：

```json
{
  "code": 401,
  "success": false,
  "msg": "认证失败",
  "msgDetail": "API Key 无效或已过期，请检查 Authorization header",
  "data": null,
  "timestamp": 1709712000000
}
```

### 3. 性能要求

- **响应时间**：接口响应时间应在 3 秒以内
- **数据量**：单次请求返回的订单数据建议不超过 10,000 条
- **并发支持**：支持至少 10 QPS（每秒查询数）

### 4. 数据更新频率

- **订单数据**：实时更新，订单状态变更后立即可查询
- **机器人状态**：实时更新，状态变更后 1 分钟内可查询

---

## Dashboard 使用场景

Dashboard 系统通过这三个接口实现以下功能模块：

### 0. 站点选择器
- **数据来源**：`/api/sites`
- **功能说明**：
  - 页面顶部"站点选择"下拉框展示所有站点（+ "全部站点"选项）
  - 用户选择站点后，所有图表模块按选中的 `siteId` 对订单和充电车数据进行过滤
  - Dashboard 后端通过订单和充电车记录中的 `siteId` 字段完成过滤，无需云平台提供带参数的筛选接口

### 1. 总览指标
- **数据来源**：`/api/orders` + `/api/robots`
- **计算指标**：
  - 总订单数：（按 `siteId` 过滤后）订单总数量
  - 总充电度数：（按 `siteId` 过滤后）所有订单 `actualKwh` 之和
  - 活跃充电车数：（按 `siteId` 过滤后）`active = true` 的充电车数量

### 2. 完单率分析
- **数据来源**：`/api/orders`
- **站点过滤**：按 `siteId` 过滤后，仅统计所选站点的订单
- **计算逻辑**：
  - 满足订单：`actualKwh >= estimatedKwh`
  - 未满足订单：`actualKwh < estimatedKwh`
  - 完单率 = 满足订单数 / 总订单数 × 100%

### 3. 结束原因分布
- **数据来源**：`/api/orders`
- **站点过滤**：按 `siteId` 过滤后，仅统计所选站点的订单
- **统计维度**：按 `endReason` 分组统计订单数量

### 4. 24小时订单热力图
- **数据来源**：`/api/orders`
- **站点过滤**：按 `siteId` 过滤后，仅统计所选站点的订单
- **统计维度**：按 `(dayOfWeek, timeSlot)` 二维分组统计订单密度

### 5. 平均服务流程耗时
- **数据来源**：`/api/orders`
- **站点过滤**：按 `siteId` 过滤后，仅对所选站点的订单求平均值
- **计算指标**：
  - 响应耗时：`responseMinutes` 平均值
  - 行驶耗时：`travelMinutes` 平均值
  - 插枪耗时：`plugInMinutes` 平均值
  - 充电耗时：`chargeMinutes` 平均值
  - 拔枪耗时：`plugOutMinutes` 平均值
  - 总耗时：以上各项之和

### 6. 订单取消分析
- **数据来源**：`/api/orders`
- **站点过滤**：按 `siteId` 过滤后，仅统计所选站点的非正常结束订单
- **分析维度**：
  - 主动取消：`endReason = USER_CANCEL`
  - 超时取消：`endReason = ROBOT_FAILURE` 或 `OTHER`
  - 运营取消：`endReason = OPS_FORCE`
  - 平均等待时长：非正常结束订单的 `cancelMinutes` 平均值

### 7. 用户充电频次（忠诚度）
- **数据来源**：`/api/orders`
- **站点过滤**：按 `siteId` 过滤后，仅统计所选站点内产生订单的用户
- **统计逻辑**：按 `userId` 分组统计每个用户的订单数，分桶：
  - 1次
  - 2次
  - 3-5次
  - >5次

### 8. 营收驾驶舱（可选对接路径）
- **云平台聚合（推荐）**：`GET /api/revenue/cockpit`，查询参数 **`siteId`**、**`preset`** 或 **`beginDate`+`endDate`**（见上文「营收驾驶舱：`/api/revenue/cockpit` 查询参数」）。
- **元数据**：不要求单独接口；**字段映射与口径** 以本文档 **附录 B** 为准（无 presets/业务字典等枚举类 HTTP 约定）。
- **备选**：运营中心拉取 `/api/orders`（及站点）本地聚合，则无需调用 `/api/revenue/cockpit`，展示口径仍须与附录 B 一致。

---

## 对接实现参考

### Java (Spring Boot) 调用示例

```java
@Service
public class CloudApiClientImpl implements CloudApiClient {

    private final RestTemplate restTemplate;

    @Value("${cloud.api.base-url}")
    private String baseUrl;

    @Value("${cloud.api.key}")
    private String apiKey;

    @Override
    public List<SiteRecord> getSites() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Result<List<SiteRecord>>> response = restTemplate.exchange(
            baseUrl + "/api/sites",
            HttpMethod.GET,
            entity,
            new ParameterizedTypeReference<Result<List<SiteRecord>>>() {}
        );

        Result<List<SiteRecord>> result = response.getBody();

        if (result == null || !result.getSuccess()) {
            throw new RuntimeException("获取站点数据失败: " +
                (result != null ? result.getMsg() : "响应为空"));
        }

        return result.getData();
    }

    @Override
    public List<OrderRecord> getOrders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        // 使用 ParameterizedTypeReference 处理泛型
        ResponseEntity<Result<List<OrderRecord>>> response = restTemplate.exchange(
            baseUrl + "/api/orders",
            HttpMethod.GET,
            entity,
            new ParameterizedTypeReference<Result<List<OrderRecord>>>() {}
        );

        Result<List<OrderRecord>> result = response.getBody();

        // 检查业务状态
        if (result == null || !result.getSuccess()) {
            throw new RuntimeException("获取订单数据失败: " +
                (result != null ? result.getMsg() : "响应为空"));
        }

        return result.getData();
    }

    @Override
    public List<RobotRecord> getRobots() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Result<List<RobotRecord>>> response = restTemplate.exchange(
            baseUrl + "/api/robots",
            HttpMethod.GET,
            entity,
            new ParameterizedTypeReference<Result<List<RobotRecord>>>() {}
        );

        Result<List<RobotRecord>> result = response.getBody();

        if (result == null || !result.getSuccess()) {
            throw new RuntimeException("获取机器人数据失败: " +
                (result != null ? result.getMsg() : "响应为空"));
        }

        return result.getData();
    }
}
```

**Result 类定义**：

```java
package com.robot.op.common;

import lombok.Data;
import java.io.Serializable;

@Data
public class Result<T> implements Serializable {
    private Integer code;
    private Boolean success;
    private String msg;
    private String msgDetail;
    private T data;
    private Long timestamp;
}
```

### 配置文件示例 (application.yml)

```yaml
cloud:
  api:
    base-url: https://cloud-platform.example.com
    api-key: ${CLOUD_API_KEY}
    mock: false  # 生产环境设为 false，开发环境设为 true 使用 Mock 数据
```

---

## 测试数据要求

为便于对接测试，建议云平台提供测试环境，包含以下测试数据：

1. **站点数据**：至少 3 个站点
   - `siteId` 全局唯一，格式如 `SITE001`、`SITE002`
   - 覆盖不同城市或区域，便于测试站点筛选功能

2. **订单数据**：至少 1000 条订单记录
   - 覆盖所有 6 种 `endReason` 类型
   - 覆盖一周 7 天的时间分布
   - 包含多个用户的重复订单（测试忠诚度分析）
   - 订单需分布在多个站点（每个站点至少 100 条）

3. **充电车数据**：至少 50 台充电车
   - 包含活跃和非活跃状态
   - 活跃充电车占比约 70-80%
   - VIN 码符合标准格式
   - 每个站点至少分配 5 辆充电车

---

## 附录

### A. 数据模型类定义

#### SiteRecord.java

```java
package com.robot.op.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 站点基本信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiteRecord {
    /** 站点唯一标识符 */
    private String id;

    /** 站点名称（对人可读的展示名） */
    private String name;
}
```

#### OrderRecord.java

```java
package com.robot.op.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRecord {
    private String orderId;
    private String siteId;
    private int daysAgo;
    private int dayOfWeek;
    private int timeSlot;
    private String endReason;
    private double estimatedKwh;
    private double actualKwh;
    private String userId;
    private int responseMinutes;
    private int travelMinutes;
    private int plugInMinutes;
    private int chargeMinutes;
    private int plugOutMinutes;
    private int cancelMinutes;
}
```

#### RobotRecord.java

```java
package com.robot.op.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 充电车状态原始记录
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RobotRecord {
    /** 车辆识别码（Vehicle Identification Number） */
    private String vin;

    /** 所属站点标识符，与 /api/sites 中的 id 对应 */
    private String siteId;

    /** true = 运营中（活跃），false = 离线/维护 */
    private boolean active;
}
```

---

### B. 营收驾驶舱元数据（文档级说明）

以下内容为 **对接元数据**，与「单独提供枚举/字典类 HTTP 接口」无关；联调时以书面约定为准。

| 说明项 | 约定 |
|--------|------|
| **对接接口** | 营收数据仅依赖 `GET /api/revenue/cockpit`（或运营中心本地聚合 `/api/orders`） |
| **响应模型** | 与「§4 营收驾驶舱聚合数据」响应体中 `data` 结构一致（`totalRevenue`、`avgOrderValue`、`orderCount`、`trend`、`businessMix`、`topSites`、`heatmap`、`heatmapDayLabels`） |
| **开放平台映射** | 由云平台补充：各金额字段对应开放平台的订单金额/营收字段名；**含税口径、币种、时区、按日切分边界** 须书面固定 |
| **坐标含义** | `trend`：横轴为日期或约定时间桶标签（`dateLabel`）；`heatmap`：`[星期索引 0–6, 小时 0–23, 强度]`；`heatmapDayLabels` 与星期索引顺序一致 |
| **preset 语义** | `today` / `yesterday` / `7d` / `30d` / `mtd` 与运营中心 `RevenueController` 一致；若云平台仅支持日期区间，可通过 `beginDate`+`endDate` 对齐同一统计窗口 |

---

**文档版本**：v2.4
**最后更新**：2026-03-31
**更新说明**：v2.4 收敛营收对接：**仅要求** `GET /api/revenue/cockpit` 提供营收/应收聚合数据；**取消** `/api/metadata/revenue-cockpit` 及 presets/业务字典等枚举类接口约定；元数据改为 **附录 B** 文档说明。
**文档状态**：已审核
