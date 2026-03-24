package com.robot.op.client.impl;

import com.robot.op.client.CloudApiClient;
import com.robot.op.client.dto.OrderRecord;
import com.robot.op.client.dto.RobotRecord;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;

@Component
@ConditionalOnProperty(name = "cloud.api.mock", havingValue = "true", matchIfMissing = true)
public class MockCloudApiClient implements CloudApiClient {

    private static final String[][] SITES = {
            {"S001", "港城广场"},
            {"S002", "临港基地"},
            {"S003", "泰安运营"},
    };
    // 各站点订单占比权重
    private static final double[] SITE_WEIGHTS = {0.40, 0.35, 0.25};

    private static final int DAYS = 30;
    private static final int ORDERS_PER_DAY = 180;
    private static final int ROBOTS_PER_SITE = 20;
    private static final int ACTIVE_RATE_PCT = 75;

    private static final List<OrderRecord> ORDERS = generateOrders();
    private static final List<RobotRecord> ROBOTS = generateRobots();

    @Override
    public List<OrderRecord> getOrders() {
        return ORDERS;
    }

    @Override
    public List<RobotRecord> getRobots() {
        return ROBOTS;
    }

    @Override
    public List<Map<String, String>> getSites() {
        List<Map<String, String>> list = new ArrayList<>();
        for (String[] s : SITES) {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("id", s[0]);
            m.put("name", s[1]);
            list.add(m);
        }
        return list;
    }

    // -------------------- 数据生成 --------------------

    private static List<OrderRecord> generateOrders() {
        Random rng = new Random(42);
        List<OrderRecord> orders = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int daysAgo = 0; daysAgo < DAYS; daysAgo++) {
            LocalDate date = today.minusDays(daysAgo);
            int dow = date.getDayOfWeek().getValue() - 1; // 0=Mon..6=Sun

            // 每天按时间槽权重分配订单
            double[] slotWeights = new double[48];
            double totalW = 0;
            for (int slot = 0; slot < 48; slot++) {
                double h = slot / 2.0;
                boolean weekday = dow < 5;
                double p1 = gaussian(h, 8.5, 1.8) * (weekday ? 100 : 40);
                double p2 = gaussian(h, 16.0, 1.5) * (weekday ? 85 : 50);
                double base = gaussian(h, 12.0, 5.0) * 8;
                slotWeights[slot] = p1 + p2 + base + 0.5;
                totalW += slotWeights[slot];
            }

            // 当天总订单稍有波动
            int dayTotal = ORDERS_PER_DAY + rng.nextInt(41) - 20;

            for (int slot = 0; slot < 48; slot++) {
                int count = Math.max(0, (int) Math.round(slotWeights[slot] / totalW * dayTotal));
                for (int i = 0; i < count; i++) {
                    String siteId = pickSite(rng);
                    orders.add(buildOrder(siteId, daysAgo, dow, slot, rng));
                }
            }
        }
        return orders;
    }

    private static String pickSite(Random rng) {
        double r = rng.nextDouble();
        double cumulative = 0;
        for (int i = 0; i < SITES.length; i++) {
            cumulative += SITE_WEIGHTS[i];
            if (r < cumulative) return SITES[i][0];
        }
        return SITES[SITES.length - 1][0];
    }

    private static OrderRecord buildOrder(String siteId, int daysAgo, int dow, int slot, Random rng) {
        String endReason = pickEndReason(rng);

        double estimatedKwh = 15 + rng.nextDouble() * 45;
        double actualKwh;
        if ("NORMAL".equals(endReason)) {
            actualKwh = rng.nextDouble() < 0.975
                    ? estimatedKwh * (0.98 + rng.nextDouble() * 0.15)
                    : estimatedKwh * (0.5 + rng.nextDouble() * 0.45);
        } else {
            actualKwh = estimatedKwh * (0.05 + rng.nextDouble() * 0.4);
        }

        String businessType = pickBusinessType(rng);
        double revenueYuan = estimateRevenueYuan(endReason, actualKwh, rng);

        return OrderRecord.builder()
                .orderId(UUID.randomUUID().toString())
                .siteId(siteId)
                .daysAgo(daysAgo)
                .dayOfWeek(dow)
                .timeSlot(slot)
                .endReason(endReason)
                .estimatedKwh(round2(estimatedKwh))
                .actualKwh(round2(actualKwh))
                .userId(pickUserId(rng))
                .responseMinutes(clamp(gauss(rng, 2, 1), 1, 8))
                .travelMinutes(clamp(gauss(rng, 5, 2), 1, 15))
                .plugInMinutes(clamp(gauss(rng, 3, 1), 1, 8))
                .chargeMinutes(clamp(gauss(rng, 45, 12), 10, 120))
                .plugOutMinutes(clamp(gauss(rng, 2, 1), 1, 8))
                .cancelMinutes("NORMAL".equals(endReason) ? 0 : clamp(gauss(rng, 12, 5), 1, 40))
                .revenueYuan(revenueYuan)
                .businessType(businessType)
                .build();
    }

    private static String pickBusinessType(Random rng) {
        double r = rng.nextDouble();
        if (r < 0.52) {
            return "DELIVERY";
        }
        if (r < 0.86) {
            return "BOOKING";
        }
        return "EMERGENCY";
    }

    private static double estimateRevenueYuan(String endReason, double actualKwh, Random rng) {
        if ("NORMAL".equals(endReason) || "VEHICLE_FULL".equals(endReason)) {
            return round2(actualKwh * (3.2 + rng.nextDouble() * 0.8));
        }
        return round2(actualKwh * rng.nextDouble() * 2.2);
    }

    private static String pickEndReason(Random rng) {
        double r = rng.nextDouble();
        if (r < 0.85) return "NORMAL";
        if (r < 0.93) return "USER_CANCEL";
        if (r < 0.97) return "ROBOT_FAILURE";
        if (r < 0.98) return "VEHICLE_FULL";
        if (r < 0.99) return "OPS_FORCE";
        return "OTHER";
    }

    private static String pickUserId(Random rng) {
        int totalWeight = 100 * 3 + 200 * 2 + 550;
        int r = rng.nextInt(totalWeight);
        int userId;
        if (r < 300) userId = 1 + rng.nextInt(100);
        else if (r < 700) userId = 101 + rng.nextInt(200);
        else userId = 301 + rng.nextInt(550);
        return String.format("U%03d", userId);
    }

    private static List<RobotRecord> generateRobots() {
        List<RobotRecord> robots = new ArrayList<>();
        Random rng = new Random(99);
        for (int s = 0; s < SITES.length; s++) {
            for (int i = 1; i <= ROBOTS_PER_SITE; i++) {
                boolean active = rng.nextInt(100) < ACTIVE_RATE_PCT;
                robots.add(new RobotRecord(
                        String.format("LCHGEV%s%04d", SITES[s][0], i),
                        SITES[s][0],
                        active
                ));
            }
        }
        return robots;
    }

    private static double gaussian(double x, double mean, double sigma) {
        return Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));
    }
    private static int gauss(Random rng, int mean, int stddev) {
        return (int) Math.round(mean + rng.nextGaussian() * stddev);
    }
    private static int clamp(int val, int min, int max) {
        return Math.max(min, Math.min(max, val));
    }
    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
