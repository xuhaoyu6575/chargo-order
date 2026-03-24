package com.robot.op.service;

import com.robot.op.client.CloudApiClient;
import com.robot.op.client.dto.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RevenueService {

    private static final List<String> HEATMAP_DAYS = List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");

    private final CloudApiClient cloudApiClient;

    public RevenueService(CloudApiClient cloudApiClient) {
        this.cloudApiClient = cloudApiClient;
    }

    public RevenueCockpitVO getCockpit(String siteId, String preset) {
        String p = preset == null || preset.isBlank() ? "30d" : preset.trim();
        if (!isAllowedPreset(p)) {
            throw new IllegalArgumentException("不支持的 preset: " + preset);
        }

        List<OrderRecord> all = cloudApiClient.getOrders();
        List<OrderRecord> filtered = all.stream()
                .filter(o -> siteMatches(siteId, o))
                .filter(o -> inPreset(o, p))
                .collect(Collectors.toList());

        if (filtered.isEmpty()) {
            return buildSimulatedCockpit(p);
        }

        double total = filtered.stream().mapToDouble(this::orderRevenue).sum();
        int count = filtered.size();
        double aov = count > 0 ? Math.round((total / count) * 10.0) / 10.0 : 0;

        LocalDate today = LocalDate.now();
        List<Integer> trendDayAgos = trendDayAgos(p, today);
        List<RevenueTrendPoint> trend = buildTrend(filtered, trendDayAgos, today);
        List<RevenueMixItem> mix = buildMix(filtered);
        List<RevenueTopSite> topSites = buildTopSites(filtered);
        List<List<Integer>> heatmap = buildHeatmap(filtered);

        return RevenueCockpitVO.builder()
                .totalRevenue(round2(total))
                .avgOrderValue(aov)
                .orderCount(count)
                .trend(trend)
                .businessMix(mix)
                .topSites(topSites)
                .heatmap(heatmap)
                .heatmapDayLabels(new ArrayList<>(HEATMAP_DAYS))
                .build();
    }

    private static boolean isAllowedPreset(String p) {
        return Set.of("today", "yesterday", "7d", "30d", "mtd").contains(p);
    }

    private static boolean siteMatches(String siteId, OrderRecord o) {
        if (siteId == null || siteId.isBlank()) {
            return true;
        }
        return siteId.equals(o.getSiteId());
    }

    private boolean inPreset(OrderRecord o, String preset) {
        int da = o.getDaysAgo();
        if (da < 0) {
            return false;
        }
        return switch (preset) {
            case "today" -> da == 0;
            case "yesterday" -> da == 1;
            case "7d" -> da < 7;
            case "mtd" -> da < monthToDateSpan();
            case "30d" -> da < 30;
            default -> da < 30;
        };
    }

    /** 与前端 mock 的「本月至今」跨度大致对齐：当月已过天数，上限 30 */
    private int monthToDateSpan() {
        int dom = LocalDate.now().getDayOfMonth();
        return Math.min(dom, 30);
    }

    /** 趋势图横轴：从旧到新，每一项为 daysAgo（0=今天） */
    private List<Integer> trendDayAgos(String preset, LocalDate today) {
        return switch (preset) {
            case "today" -> List.of(0);
            case "yesterday" -> List.of(1);
            case "7d" -> descendingRange(6);
            case "mtd" -> descendingRange(Math.min(today.getDayOfMonth(), 30) - 1);
            case "30d" -> descendingRange(29);
            default -> descendingRange(29);
        };
    }

    private static List<Integer> descendingRange(int maxDa) {
        int n = Math.max(maxDa, 0);
        List<Integer> list = new ArrayList<>(n + 1);
        for (int da = n; da >= 0; da--) {
            list.add(da);
        }
        return list;
    }

    private List<RevenueTrendPoint> buildTrend(List<OrderRecord> orders, List<Integer> dayAgos, LocalDate today) {
        double[] byDayAgo = new double[64];
        for (OrderRecord o : orders) {
            int da = o.getDaysAgo();
            if (da >= 0 && da < byDayAgo.length) {
                byDayAgo[da] += orderRevenue(o);
            }
        }
        List<RevenueTrendPoint> list = new ArrayList<>();
        for (int da : dayAgos) {
            if (da < 0 || da >= byDayAgo.length) {
                continue;
            }
            LocalDate d = today.minusDays(da);
            String label = d.getMonthValue() + "月" + d.getDayOfMonth();
            list.add(new RevenueTrendPoint(label, round2(byDayAgo[da])));
        }
        return list;
    }

    private List<RevenueMixItem> buildMix(List<OrderRecord> orders) {
        double d = 0, b = 0, e = 0;
        for (OrderRecord o : orders) {
            double r = orderRevenue(o);
            String t = normalizeBusiness(o.getBusinessType());
            switch (t) {
                case "BOOKING" -> b += r;
                case "EMERGENCY" -> e += r;
                default -> d += r;
            }
        }
        List<RevenueMixItem> mix = new ArrayList<>();
        mix.add(new RevenueMixItem("送电", round2(d)));
        mix.add(new RevenueMixItem("预约", round2(b)));
        mix.add(new RevenueMixItem("应急救援", round2(e)));
        return mix;
    }

    private List<RevenueTopSite> buildTopSites(List<OrderRecord> orders) {
        Map<String, Double> sum = new HashMap<>();
        for (OrderRecord o : orders) {
            sum.merge(o.getSiteId(), orderRevenue(o), Double::sum);
        }
        Map<String, String> idToName = new HashMap<>();
        for (Map<String, String> s : cloudApiClient.getSites()) {
            idToName.put(s.get("id"), s.get("name"));
        }
        return sum.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(e -> new RevenueTopSite(
                        idToName.getOrDefault(e.getKey(), e.getKey()),
                        round2(e.getValue())))
                .collect(Collectors.toList());
    }

    private List<List<Integer>> buildHeatmap(List<OrderRecord> orders) {
        double[][] cell = new double[7][24];
        for (OrderRecord o : orders) {
            int wd = o.getDayOfWeek();
            if (wd < 0 || wd > 6) {
                continue;
            }
            int hour = Math.min(23, Math.max(0, o.getTimeSlot() / 2));
            cell[wd][hour] += orderRevenue(o);
        }
        double max = 1;
        for (double[] row : cell) {
            for (double v : row) {
                max = Math.max(max, v);
            }
        }
        List<List<Integer>> out = new ArrayList<>();
        Random rng = new Random(42);
        for (int h = 0; h < 24; h++) {
            for (int wd = 0; wd < 7; wd++) {
                double v = cell[wd][h];
                int intensity = (int) Math.round(5 + (v / max) * 45 + rng.nextDouble() * 3);
                intensity = Math.min(55, Math.max(1, intensity));
                out.add(List.of(wd, h, intensity));
            }
        }
        return out;
    }

    private double orderRevenue(OrderRecord o) {
        if (o.getRevenueYuan() > 0) {
            return o.getRevenueYuan();
        }
        if ("NORMAL".equals(o.getEndReason()) || "VEHICLE_FULL".equals(o.getEndReason())) {
            return round2(o.getActualKwh() * 3.5);
        }
        return round2(o.getActualKwh() * 1.2);
    }

    private static String normalizeBusiness(String raw) {
        if (raw == null || raw.isEmpty()) {
            return "DELIVERY";
        }
        String u = raw.toUpperCase(Locale.ROOT);
        if (u.contains("BOOK")) {
            return "BOOKING";
        }
        if (u.contains("EMERG")) {
            return "EMERGENCY";
        }
        return "DELIVERY";
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    /**
     * 无订单数据时的确定性仿真（与前端演示量级接近），保证接口始终返回完整结构。
     */
    private RevenueCockpitVO buildSimulatedCockpit(String preset) {
        LocalDate today = LocalDate.now();
        List<Integer> dayAgos = trendDayAgos(preset, today);
        Random rng = new Random(Objects.hash(preset, today.getDayOfYear()));
        List<RevenueTrendPoint> trend = new ArrayList<>();
        int idx = 0;
        for (int da : dayAgos) {
            LocalDate d = today.minusDays(da);
            double base = 8000 + ((d.getDayOfWeek().getValue() % 7) + 1) * 1200.0;
            double rev = Math.round(base + Math.sin(idx / 3.0) * 4000 + (idx % 5) * 800 + rng.nextDouble() * 2000);
            trend.add(new RevenueTrendPoint(d.getMonthValue() + "月" + d.getDayOfMonth(), rev));
            idx++;
        }

        double delivery = 176_275;
        double booking = 96_150;
        double emergency = 48_075;
        double total = delivery + booking + emergency;
        int orderCount = Math.max(1, (int) Math.round(total / 105.5));
        double aov = Math.round((total / orderCount) * 10.0) / 10.0;

        List<RevenueTopSite> topSites = List.of(
                new RevenueTopSite("港城广场", 176_275),
                new RevenueTopSite("临港基地", 142_800),
                new RevenueTopSite("泰安运营", 128_400),
                new RevenueTopSite("金桥示范", 98_500),
                new RevenueTopSite("张江站点", 87_300)
        );

        List<RevenueMixItem> mix = List.of(
                new RevenueMixItem("送电", delivery),
                new RevenueMixItem("预约", booking),
                new RevenueMixItem("应急救援", emergency)
        );

        List<List<Integer>> heatmap = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            for (int wd = 0; wd < 7; wd++) {
                double v = 2 + rng.nextDouble() * 8;
                if (wd >= 5 && h >= 11 && h <= 21) {
                    v += 25 + rng.nextDouble() * 20;
                }
                if (wd >= 4 && wd <= 5 && h >= 16 && h <= 20) {
                    v += 15;
                }
                heatmap.add(List.of(wd, h, (int) Math.round(v)));
            }
        }

        return RevenueCockpitVO.builder()
                .totalRevenue(total)
                .avgOrderValue(aov)
                .orderCount(orderCount)
                .trend(trend)
                .businessMix(mix)
                .topSites(topSites)
                .heatmap(heatmap)
                .heatmapDayLabels(new ArrayList<>(HEATMAP_DAYS))
                .build();
    }
}
