package com.robot.op.client.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.robot.op.client.CloudApiClient;
import com.robot.op.client.dto.CloudPageRequest;
import com.robot.op.client.dto.OrderRecord;
import com.robot.op.client.dto.RobotRecord;
import com.robot.op.service.CloudAuthService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import com.robot.op.config.NeedsRealCloudClientCondition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Conditional;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 真实实现：当 Dashboard 或营收任一侧需要走云平台时注册（见 {@link NeedsRealCloudClientCondition}），通过 RestTemplate 调用 HTTP。
 * 使用 CloudAuthService 获取 token，POST 分页请求，并将云平台返回映射为运营中心约定格式。
 * <p>
 * 成功响应体对齐 {@code cloud_api/cloud_API_doc.md}：<br>
 * {@code { "code": 200, "success": true, "msg", "msgDetail", "data": [ ... ] 或分页时 data: { "list", "total" } }}<br>
 * 同时兼容开放平台 {@code code: "0"} 与 {@code errorDetail} 字段。
 */
@Slf4j
@Component
@Conditional(NeedsRealCloudClientCondition.class)
public class CloudApiClientImpl implements CloudApiClient {

    private static final int PAGE_SIZE = 9999;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final String baseUrl;
    private final RestTemplate restTemplate;
    private final CloudAuthService cloudAuthService;
    private final ObjectMapper objectMapper;

    public CloudApiClientImpl(@Value("${cloud.api.base-url}") String baseUrl,
                             RestTemplate restTemplate,
                             CloudAuthService cloudAuthService,
                             ObjectMapper objectMapper) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.restTemplate = restTemplate;
        this.cloudAuthService = cloudAuthService;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void logMode() {
        log.info("云平台客户端: 真实 HTTP（CloudApiClientImpl）baseUrl={}，拉数会 POST /api/sites|/api/robots|/api/orders", baseUrl);
    }

    private String baseUrl() {
        return baseUrl;
    }

    @Override
    public List<OrderRecord> getOrders() {
        LocalDate end = LocalDate.now();
        LocalDate begin = end.minusDays(29);
        log.debug("拉取云平台订单: {} ~ {}", begin.format(DATE_FMT), end.format(DATE_FMT));
        List<Map<String, Object>> raw = fetchAllPages("/api/orders", CloudPageRequest.builder()
                .pageNo(1)
                .pageSize(PAGE_SIZE)
                .beginDate(begin.format(DATE_FMT))
                .endDate(end.format(DATE_FMT))
                .build());
        List<OrderRecord> mapped = raw.stream().map(this::mapToOrderRecord).collect(Collectors.toList());
        log.info("云平台订单映射完成: 原始条数={} 映射条数={}", raw.size(), mapped.size());
        return mapped;
    }

    @Override
    public List<RobotRecord> getRobots() {
        List<Map<String, Object>> raw = fetchAllPages("/api/robots", CloudPageRequest.builder()
                .pageNo(1)
                .pageSize(PAGE_SIZE)
                .build());
        List<RobotRecord> list = raw.stream().map(this::mapToRobotRecord).collect(Collectors.toList());
        log.info("云平台车辆列表: {} 条", list.size());
        return list;
    }

    @Override
    public List<Map<String, String>> getSites() {
        List<Map<String, Object>> raw = fetchAllPages("/api/sites", CloudPageRequest.builder()
                .pageNo(1)
                .pageSize(PAGE_SIZE)
                .build());
        List<Map<String, String>> list = raw.stream().map(this::mapToSiteRecord).collect(Collectors.toList());
        log.info("云平台站点列表: {} 条", list.size());
        return list;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchAllPages(String path, CloudPageRequest req) {
        long t0 = System.nanoTime();
        List<Map<String, Object>> all = new ArrayList<>();
        int pageNo = req.getPageNo() != null ? req.getPageNo() : 1;
        int pageSize = req.getPageSize() != null ? req.getPageSize() : PAGE_SIZE;
        int pages = 0;

        log.info("云平台分页开始 path={} pageSize={} beginDate={} endDate={} siteId={}",
                path, pageSize, req.getBeginDate(), req.getEndDate(), req.getSiteId());

        while (true) {
            CloudPageRequest pageReq = CloudPageRequest.builder()
                    .pageNo(pageNo)
                    .pageSize(pageSize)
                    .siteId(req.getSiteId())
                    .beginDate(req.getBeginDate())
                    .endDate(req.getEndDate())
                    .build();

            Map<String, Object> body = pageReq.toMap();
            Map<String, Object> resp = postForMap(baseUrl() + path, body);
            pages++;
            List<Map<String, Object>> list = extractList(resp);
            logPageMeta(path, pageNo, resp, list);
            if (list != null && !list.isEmpty()) {
                all.addAll(list);
            } else if (pages == 1) {
                log.warn("云平台 path={} 第1页未解析到列表：请核对开放平台返回结构（data 为数组或 data.list）",
                        path);
            }
            if (list == null || list.size() < pageSize) {
                break;
            }
            pageNo++;
            log.debug("云平台分页 path={} 下一页 pageNo={} 本页条数={} 已累计={}",
                    path, pageNo, list.size(), all.size());
        }
        long ms = (System.nanoTime() - t0) / 1_000_000L;
        log.info("云平台分页结束 path={} 请求页数={} 累计条数={} 总耗时={}ms", path, pages, all.size(), ms);
        return all;
    }

    /** 记录开放平台常见分页字段，便于对照文档排查 */
    @SuppressWarnings("unchecked")
    private void logPageMeta(String path, int pageNo, Map<String, Object> resp, List<Map<String, Object>> list) {
        int n = list == null ? 0 : list.size();
        Object data = resp.get("data");
        if (data instanceof Map) {
            Map<String, Object> dm = (Map<String, Object>) data;
            Object total = dm.get("total");
            Object pageNum = dm.get("pageNum");
            Object pageNoField = dm.get("pageNo");
            log.debug("云平台 path={} pageNo={} 本页条数={} data.total={} data.pageNum={} data.pageNo={}",
                    path, pageNo, n, total, pageNum, pageNoField);
        } else {
            log.debug("云平台 path={} pageNo={} 本页条数={} (data 非 Map 包装)", path, pageNo, n);
        }
    }

    /**
     * 解析列表：优先 {@code data} 为数组（与 cloud_API_doc.md 中 Result&lt;List&lt;...&gt;&gt; 一致）；
     * 否则尝试 {@code data.list}（开放平台分页常见）。
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractList(Map<String, Object> resp) {
        Object data = resp.get("data");
        if (data == null) {
            return Collections.emptyList();
        }
        if (data instanceof List) {
            return (List<Map<String, Object>>) data;
        }
        if (data instanceof Map) {
            Map<String, Object> m = (Map<String, Object>) data;
            Object list = m.get("list");
            if (list instanceof List) {
                return (List<Map<String, Object>>) list;
            }
        }
        log.warn("云平台 data 既不是数组也不是带 list 的对象，无法解析列表 keys={}",
                data instanceof Map ? ((Map<?, ?>) data).keySet() : data.getClass().getSimpleName());
        return Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> postForMap(String url, Map<String, Object> body) {
        if (log.isTraceEnabled()) {
            log.trace("云平台 POST bodyKeys={}", body == null ? "null" : body.keySet());
        }
        HttpHeaders headers = cloudAuthService.getAuthHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> resp = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );
            Map<String, Object> result = resp.getBody();
            if (result == null) {
                log.warn("云平台响应体为空 url={}", url);
                throw new RuntimeException("云平台响应为空");
            }
            log.info("云平台原始响应 url={} body={}", url, rawResponseBody(result));
            if (!isBizSuccess(result)) {
                String msg = String.valueOf(result.getOrDefault("msg", "未知错误"));
                Object code = result.get("code");
                Object msgDetail = result.get("msgDetail");
                Object errDetail = result.get("errorDetail");
                log.warn("云平台业务失败 url={} code={} msg={} msgDetail={} errorDetail={}",
                        url, code, msg,
                        msgDetail != null ? msgDetail : "",
                        errDetail != null ? errDetail : "");
                throw new RuntimeException("云平台请求失败: " + msg);
            }
            warnIfSuccessInconsistent(result);
            return result;
        } catch (RestClientException e) {
            log.error("云平台 RestTemplate 异常 url={}", url, e);
            throw e;
        }
    }

    private String rawResponseBody(Map<String, Object> result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException e) {
            return String.valueOf(result);
        }
    }

    /**
     * 成功判定：开放平台 {@code code "0"}；运营中心文档 {@code code 200}（含 Long/Double/String 等 JSON 数字形态）。
     * 若缺少 {@code code} 仅有 {@code success==true}，也视为成功（兼容少数网关）。
     */
    private static boolean isBizSuccess(Map<String, Object> result) {
        Object code = result.get("code");
        if (isSuccessCode(code)) {
            return true;
        }
        return Boolean.TRUE.equals(result.get("success")) && code == null;
    }

    private static boolean isSuccessCode(Object code) {
        if (code == null) {
            return false;
        }
        String s = String.valueOf(code).trim();
        if ("0".equals(s)) {
            return true;
        }
        if (code instanceof Number) {
            return ((Number) code).intValue() == 200;
        }
        try {
            return Integer.parseInt(s) == 200;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * cloud_API_doc.md：成功时 {@code code=200} 且 {@code success=true}。
     * 开放平台 {@code code=0} 时不校验 success。
     */
    private void warnIfSuccessInconsistent(Map<String, Object> result) {
        Object code = result.get("code");
        if (!isSuccessCode(code) || "0".equals(String.valueOf(code).trim())) {
            return;
        }
        Object success = result.get("success");
        if (success != null && !Boolean.TRUE.equals(success)) {
            log.warn("云平台响应与文档不一致: code 已为成功但 success!=true, code={} success={}", code, success);
        }
    }

    private Map<String, String> mapToSiteRecord(Map<String, Object> m) {
        Map<String, String> out = new LinkedHashMap<>();
        out.put("id", getStr(m, "id", "siteCode", "siteId"));
        out.put("name", getStr(m, "name", "siteName"));
        return out;
    }

    private RobotRecord mapToRobotRecord(Map<String, Object> m) {
        String vin = getStr(m, "vin");
        String siteId = getStr(m, "siteId", "siteCode");
        boolean active = getBool(m, "active", "online", "onlineFlag");
        return new RobotRecord(vin, siteId, active);
    }

    private OrderRecord mapToOrderRecord(Map<String, Object> m) {
        String orderId = getStr(m, "orderId", "orderCode");
        if (orderId.isEmpty() && log.isTraceEnabled()) {
            log.trace("云平台订单映射: 缺少 orderId/orderCode，可用字段 keys={}", m.keySet());
        }
        String siteId = getStr(m, "siteId", "siteCode", "siteName");
        int daysAgo = getInt(m, "daysAgo", -1);
        int dayOfWeek = getInt(m, "dayOfWeek", -1);
        int timeSlot = getInt(m, "timeSlot", -1);
        if (daysAgo < 0 || dayOfWeek < 0 || timeSlot < 0) {
            int[] computed = computeFromCreateDate(m);
            if (daysAgo < 0) daysAgo = computed[0];
            if (dayOfWeek < 0) dayOfWeek = computed[1];
            if (timeSlot < 0) timeSlot = computed[2];
        }
        String endReason = mapEndReason(m);
        double estimatedKwh = getDouble(m, "estimatedKwh", "selectDegree", 0);
        double actualKwh = getDouble(m, "actualKwh", "useDegree", 0);
        String userId = getStr(m, "userId", "userName", "createUserName");
        int responseMinutes = getInt(m, "responseMinutes", 0);
        int travelMinutes = getInt(m, "travelMinutes", 0);
        int plugInMinutes = getInt(m, "plugInMinutes", 0);
        int chargeMinutes = getInt(m, "chargeMinutes", "costMinutes", 0);
        int plugOutMinutes = getInt(m, "plugOutMinutes", 0);
        int cancelMinutes = getInt(m, "cancelMinutes", 0);

        double revenueYuan = firstDouble(m, Double.NaN, "revenueYuan", "revenue", "amount", "orderAmount");
        if (Double.isNaN(revenueYuan)) {
            revenueYuan = 0;
        }
        if (revenueYuan <= 0 && ("NORMAL".equals(endReason) || "VEHICLE_FULL".equals(endReason))) {
            revenueYuan = round2(actualKwh * 3.5);
        }
        String businessType = normalizeBusinessType(getStr(m, "businessType", "orderType", "serviceType"));

        return OrderRecord.builder()
                .orderId(orderId)
                .siteId(siteId)
                .daysAgo(daysAgo)
                .dayOfWeek(dayOfWeek)
                .timeSlot(timeSlot)
                .endReason(endReason)
                .estimatedKwh(estimatedKwh)
                .actualKwh(actualKwh)
                .userId(userId)
                .responseMinutes(responseMinutes)
                .travelMinutes(travelMinutes)
                .plugInMinutes(plugInMinutes)
                .chargeMinutes(chargeMinutes)
                .plugOutMinutes(plugOutMinutes)
                .cancelMinutes(cancelMinutes)
                .revenueYuan(revenueYuan)
                .businessType(businessType)
                .build();
    }

    private static String normalizeBusinessType(String raw) {
        if (raw == null || raw.isEmpty()) {
            return "DELIVERY";
        }
        String s = raw.toUpperCase(Locale.ROOT);
        if (s.contains("BOOK") || raw.contains("预约")) {
            return "BOOKING";
        }
        if (s.contains("EMERG") || raw.contains("应急")) {
            return "EMERGENCY";
        }
        return "DELIVERY";
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    /** 按顺序取第一个存在的数值字段 */
    private static double firstDouble(Map<String, Object> m, double def, String... keys) {
        for (String k : keys) {
            if (!m.containsKey(k)) {
                continue;
            }
            double v = getDouble(m, k, Double.NaN);
            if (!Double.isNaN(v)) {
                return v;
            }
        }
        return def;
    }

    private String mapEndReason(Map<String, Object> m) {
        String reason = getStr(m, "endReason");
        if (reason != null && !reason.isEmpty()) return reason;
        Object cancelType = m.get("chargeCancelType");
        if (cancelType != null) {
            int ct = cancelType instanceof Number ? ((Number) cancelType).intValue() : 0;
            switch (ct) {
                case 1: return "NORMAL";
                case 2: return "USER_CANCEL";
                case 3: return "OPS_FORCE";
                case 4: return "OTHER";
                default: return "OTHER";
            }
        }
        return "NORMAL";
    }

    private static String getStr(Map<String, Object> m, String... keys) {
        for (String k : keys) {
            Object v = m.get(k);
            if (v != null && !v.toString().isEmpty()) return v.toString();
        }
        return "";
    }

    private static boolean getBool(Map<String, Object> m, String... keys) {
        for (String k : keys) {
            Object v = m.get(k);
            if (v instanceof Boolean) return (Boolean) v;
            if (v != null) return "true".equalsIgnoreCase(v.toString()) || "1".equals(v.toString());
        }
        return false;
    }

    private static int getInt(Map<String, Object> m, String key, int def) {
        Object v = m.get(key);
        if (v instanceof Number) return ((Number) v).intValue();
        if (v != null) try { return Integer.parseInt(v.toString()); } catch (NumberFormatException ignored) {}
        return def;
    }

    private static int getInt(Map<String, Object> m, String key1, String key2, int def) {
        int a = getInt(m, key1, Integer.MIN_VALUE);
        if (a != Integer.MIN_VALUE) return a;
        return getInt(m, key2, def);
    }

    private static double getDouble(Map<String, Object> m, String key, double def) {
        Object v = m.get(key);
        if (v instanceof Number) return ((Number) v).doubleValue();
        if (v != null) try { return Double.parseDouble(v.toString()); } catch (NumberFormatException ignored) {}
        return def;
    }

    private static double getDouble(Map<String, Object> m, String key1, String key2, double def) {
        double a = getDouble(m, key1, Double.NaN);
        if (!Double.isNaN(a)) return a;
        return getDouble(m, key2, def);
    }

    /** 从 createDate/chargeStartDate 计算 daysAgo, dayOfWeek, timeSlot */
    private static int[] computeFromCreateDate(Map<String, Object> m) {
        String dateStr = getStr(m, "createDate", "chargeStartDate", "createTime");
        if (dateStr == null || dateStr.isEmpty()) {
            return new int[]{0, 0, 0};
        }
        try {
            LocalDateTime dt = LocalDateTime.parse(dateStr.replace(" ", "T").substring(0, Math.min(19, dateStr.length())));
            LocalDate d = dt.toLocalDate();
            long daysAgo = ChronoUnit.DAYS.between(d, LocalDate.now());
            int dayOfWeek = d.getDayOfWeek().getValue() - 1; // Mon=0..Sun=6
            int timeSlot = dt.getHour() * 2 + (dt.getMinute() >= 30 ? 1 : 0);
            return new int[]{(int) Math.max(0, daysAgo), dayOfWeek, Math.min(47, timeSlot)};
        } catch (Exception e) {
            log.trace("订单日期解析失败，使用默认槽位: {}", dateStr);
            return new int[]{0, 0, 0};
        }
    }
}
