package com.robot.op.service;

import com.robot.op.client.CloudApiClient;
import com.robot.op.client.dto.OrderRecord;
import com.robot.op.client.dto.RobotRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j

@Service
@SuppressWarnings("java:S3776")
public class DashboardService {

    private static final Map<String, String> REASON_LABELS;

    static {
        REASON_LABELS = new LinkedHashMap<>();
        REASON_LABELS.put("NORMAL", "正常结束");
        REASON_LABELS.put("USER_CANCEL", "用户取消");
        REASON_LABELS.put("ROBOT_FAILURE", "机器人故障");
        REASON_LABELS.put("VEHICLE_FULL", "车辆满电结束");
        REASON_LABELS.put("OPS_FORCE", "运营强制结束");
        REASON_LABELS.put("OTHER", "其他异常");
    }

    private final CloudApiClient cloudApiClient;

    public DashboardService(CloudApiClient cloudApiClient) {
        this.cloudApiClient = cloudApiClient;
    }

    // -------------------- 站点列表 --------------------

    public List<Map<String, String>> getSites() {
        return cloudApiClient.getSites();
    }

    // -------------------- 公共筛选 --------------------

    private List<OrderRecord> filterOrders(String siteId, int days) {
        return cloudApiClient.getOrders().stream()
                .filter(o -> o.getDaysAgo() < days)
                .filter(o -> siteId == null || siteId.isEmpty() || siteId.equals(o.getSiteId()))
                .collect(Collectors.toList());
    }

    private List<RobotRecord> filterRobots(String siteId) {
        return cloudApiClient.getRobots().stream()
                .filter(r -> siteId == null || siteId.isEmpty() || siteId.equals(r.getSiteId()))
                .collect(Collectors.toList());
    }

    // -------------------- 总览指标 --------------------

    public Map<String, Object> getStats(String siteId, int days) {
        List<OrderRecord> orders = filterOrders(siteId, days);
        List<RobotRecord> robots = filterRobots(siteId);

        long totalKwh = Math.round(orders.stream().mapToDouble(OrderRecord::getActualKwh).sum());
        long activeRobots = robots.stream().filter(RobotRecord::isActive).count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalOrders", orders.size());
        result.put("totalKwh", totalKwh);
        result.put("activeRobots", (int) activeRobots);
        return result;
    }

    // -------------------- 完单率 --------------------

    public Map<String, Object> getCompletionRate(String siteId, int days) {
        List<OrderRecord> orders = filterOrders(siteId, days);

        long satisfied = orders.stream()
                .filter(o -> o.getActualKwh() >= o.getEstimatedKwh())
                .count();
        long unsatisfied = orders.size() - satisfied;
        int ratePercent = orders.isEmpty() ? 0
                : (int) Math.round((double) satisfied / orders.size() * 100);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("satisfied", (int) satisfied);
        result.put("unsatisfied", (int) unsatisfied);
        result.put("rate", ratePercent + "%");
        return result;
    }

    // -------------------- 结束充电原因分布 --------------------

    public List<Map<String, Object>> getEndReasons(String siteId, int days) {
        List<OrderRecord> orders = filterOrders(siteId, days);

        Map<String, Long> counts = orders.stream()
                .filter(o -> o.getEndReason() != null)
                .collect(Collectors.groupingBy(OrderRecord::getEndReason, Collectors.counting()));

        return REASON_LABELS.entrySet().stream()
                .filter(e -> counts.containsKey(e.getKey()))
                .sorted((a, b) -> Long.compare(
                        counts.getOrDefault(b.getKey(), 0L),
                        counts.getOrDefault(a.getKey(), 0L)))
                .map(e -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", e.getValue());
                    item.put("value", counts.get(e.getKey()).intValue());
                    return item;
                })
                .collect(Collectors.toList());
    }

    // -------------------- 24小时订单热力分布 --------------------

    public List<int[]> getHeatmap(String siteId, int days) {
        List<OrderRecord> orders = filterOrders(siteId, days);

        int[][] cellCounts = new int[7][48];
        for (OrderRecord order : orders) {
            int dow = order.getDayOfWeek();
            int slot = order.getTimeSlot();
            if (dow < 0 || dow >= 7 || slot < 0 || slot >= 48) {
                log.warn("订单数据越界: orderId={} dayOfWeek={} timeSlot={}", order.getOrderId(), dow, slot);
                continue;
            }
            cellCounts[dow][slot]++;
        }

        int maxCount = 1;
        for (int[] row : cellCounts) {
            for (int c : row) {
                maxCount = Math.max(maxCount, c);
            }
        }

        List<int[]> heatmap = new ArrayList<>(7 * 48);
        for (int day = 0; day < 7; day++) {
            for (int slot = 0; slot < 48; slot++) {
                int normalized = (int) Math.round((double) cellCounts[day][slot] / maxCount * 100);
                heatmap.add(new int[]{slot, day, normalized});
            }
        }
        return heatmap;
    }

    // -------------------- 平均服务流程耗时 --------------------

    public Map<String, Object> getProcessTime(String siteId, int days) {
        List<OrderRecord> orders = filterOrders(siteId, days);

        int avgResponse = avg(orders, OrderRecord::getResponseMinutes);
        int avgTravel   = avg(orders, OrderRecord::getTravelMinutes);
        int avgPlugIn   = avg(orders, OrderRecord::getPlugInMinutes);
        int avgCharge   = avg(orders, OrderRecord::getChargeMinutes);
        int avgPlugOut  = avg(orders, OrderRecord::getPlugOutMinutes);
        int avgTotal    = avgResponse + avgTravel + avgPlugIn + avgCharge + avgPlugOut;

        List<Map<String, Object>> stages = List.of(
                stageMap("响应耗时", avgResponse, "派单-下单"),
                stageMap("行驶耗时", avgTravel, "到达-派单"),
                stageMap("插枪耗时", avgPlugIn, "插枪-到达"),
                stageMap("充电耗时", avgCharge, "充电完成-插枪"),
                stageMap("拔枪耗时", avgPlugOut, "拔枪-充电完成")
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("avgTotal", avgTotal);
        result.put("stages", stages);
        return result;
    }

    // -------------------- 订单取消分析 --------------------

    public Map<String, Object> getCancelAnalysis(String siteId, int days) {
        List<OrderRecord> orders = filterOrders(siteId, days);

        long activeCancel  = count(orders, "USER_CANCEL");
        long timeoutCancel = count(orders, "ROBOT_FAILURE") + count(orders, "OTHER");
        long opsCancel     = count(orders, "OPS_FORCE");

        List<Map<String, Object>> types = new ArrayList<>();
        if (activeCancel  > 0) types.add(typeMap("主动", (int) activeCancel));
        if (timeoutCancel > 0) types.add(typeMap("超时", (int) timeoutCancel));
        if (opsCancel     > 0) types.add(typeMap("运营", (int) opsCancel));

        double avgCancelMin = orders.stream()
                .filter(o -> !"NORMAL".equals(o.getEndReason()) && !"VEHICLE_FULL".equals(o.getEndReason()))
                .mapToInt(OrderRecord::getCancelMinutes)
                .average()
                .orElse(0);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("types", types);
        result.put("avgCancelMinutes", (int) Math.round(avgCancelMin));
        return result;
    }

    // -------------------- 用户充电频次（忠诚度） --------------------

    public Map<String, Object> getUserFrequency(String siteId, int days) {
        List<OrderRecord> orders = filterOrders(siteId, days);

        Map<String, Long> ordersPerUser = orders.stream()
                .filter(o -> o.getUserId() != null)
                .collect(Collectors.groupingBy(OrderRecord::getUserId, Collectors.counting()));

        int once = 0, twice = 0, threeToFive = 0, moreThanFive = 0;
        for (long cnt : ordersPerUser.values()) {
            if (cnt == 1)      once++;
            else if (cnt == 2) twice++;
            else if (cnt <= 5) threeToFive++;
            else               moreThanFive++;
        }

        List<Map<String, Object>> data = List.of(
                freqMap("1次",   once),
                freqMap("2次",   twice),
                freqMap("3-5次", threeToFive),
                freqMap(">5次",  moreThanFive)
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers", ordersPerUser.size());
        result.put("data", data);
        return result;
    }

    // -------------------- 工具方法 --------------------

    @FunctionalInterface
    private interface IntExtractor { int get(OrderRecord o); }

    private static int avg(List<OrderRecord> orders, IntExtractor ext) {
        return orders.isEmpty() ? 0
                : (int) Math.round(orders.stream().mapToInt(ext::get).average().orElse(0));
    }

    private static long count(List<OrderRecord> orders, String reason) {
        return orders.stream().filter(o -> reason.equals(o.getEndReason())).count();
    }

    private static Map<String, Object> stageMap(String n, int v, String subProcess) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", n);
        m.put("value", v);
        m.put("subProcess", subProcess);
        return m;
    }
    private static Map<String, Object> typeMap(String n, int v) {
        Map<String, Object> m = new LinkedHashMap<>(); m.put("name", n); m.put("value", v); return m;
    }
    private static Map<String, Object> freqMap(String l, int v) {
        Map<String, Object> m = new LinkedHashMap<>(); m.put("label", l); m.put("value", v); return m;
    }
}
