package com.robot.op.client.impl;

import com.robot.op.client.CloudApiClient;
import com.robot.op.client.dto.CloudPageRequest;
import com.robot.op.client.dto.OrderRecord;
import com.robot.op.client.dto.RobotRecord;
import com.robot.op.service.CloudAuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 真实实现：当 cloud.api.mock=false 时激活，通过 RestTemplate 调用云平台 HTTP 接口。
 * 使用 CloudAuthService 获取 token，POST 分页请求，并将云平台返回映射为 cloud_API_doc.md 约定格式。
 */
@Component
@ConditionalOnProperty(name = "cloud.api.mock", havingValue = "false")
public class CloudApiClientImpl implements CloudApiClient {

    private static final int PAGE_SIZE = 9999;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final String baseUrl;
    private final RestTemplate restTemplate;
    private final CloudAuthService cloudAuthService;

    public CloudApiClientImpl(@Value("${cloud.api.base-url}") String baseUrl,
                             RestTemplate restTemplate,
                             CloudAuthService cloudAuthService) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.restTemplate = restTemplate;
        this.cloudAuthService = cloudAuthService;
    }

    private String baseUrl() {
        return baseUrl;
    }

    @Override
    public List<OrderRecord> getOrders() {
        LocalDate end = LocalDate.now();
        LocalDate begin = end.minusDays(29);
        List<Map<String, Object>> raw = fetchAllPages("/api/orders", CloudPageRequest.builder()
                .pageNo(1)
                .pageSize(PAGE_SIZE)
                .beginDate(begin.format(DATE_FMT))
                .endDate(end.format(DATE_FMT))
                .build());
        return raw.stream().map(this::mapToOrderRecord).collect(Collectors.toList());
    }

    @Override
    public List<RobotRecord> getRobots() {
        List<Map<String, Object>> raw = fetchAllPages("/api/robots", CloudPageRequest.builder()
                .pageNo(1)
                .pageSize(PAGE_SIZE)
                .build());
        return raw.stream().map(this::mapToRobotRecord).collect(Collectors.toList());
    }

    @Override
    public List<Map<String, String>> getSites() {
        List<Map<String, Object>> raw = fetchAllPages("/api/sites", CloudPageRequest.builder()
                .pageNo(1)
                .pageSize(PAGE_SIZE)
                .build());
        return raw.stream().map(this::mapToSiteRecord).collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetchAllPages(String path, CloudPageRequest req) {
        List<Map<String, Object>> all = new ArrayList<>();
        int pageNo = req.getPageNo() != null ? req.getPageNo() : 1;
        int pageSize = req.getPageSize() != null ? req.getPageSize() : PAGE_SIZE;

        while (true) {
            CloudPageRequest pageReq = CloudPageRequest.builder()
                    .pageNo(pageNo)
                    .pageSize(pageSize)
                    .siteId(req.getSiteId())
                    .beginDate(req.getBeginDate())
                    .endDate(req.getEndDate())
                    .build();

            Map<String, Object> resp = postForMap(baseUrl() + path, pageReq.toMap());
            List<Map<String, Object>> list = extractList(resp);
            if (list != null && !list.isEmpty()) {
                all.addAll(list);
            }
            if (list == null || list.size() < pageSize) {
                break;
            }
            pageNo++;
        }
        return all;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractList(Map<String, Object> resp) {
        Object data = resp.get("data");
        if (data == null) return Collections.emptyList();
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
        return Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> postForMap(String url, Map<String, Object> body) {
        HttpHeaders headers = cloudAuthService.getAuthHeaders();
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> resp = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Map.class
        );
        Map<String, Object> result = resp.getBody();
        if (result == null) {
            throw new RuntimeException("云平台响应为空");
        }
        Object code = result.get("code");
        boolean ok = "0".equals(String.valueOf(code)) || Integer.valueOf(200).equals(code);
        if (!ok) {
            String msg = String.valueOf(result.getOrDefault("msg", "未知错误"));
            throw new RuntimeException("云平台请求失败: " + msg);
        }
        return result;
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
            return new int[]{0, 0, 0};
        }
    }
}
