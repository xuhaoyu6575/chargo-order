package com.robot.op.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 营收驾驶舱接口数据结构，与前端 {@code normalizePayload} 字段一致。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueCockpitVO {

    private double totalRevenue;
    private double avgOrderValue;
    private int orderCount;
    private List<RevenueTrendPoint> trend;
    private List<RevenueMixItem> businessMix;
    private List<RevenueTopSite> topSites;
    /** 热力图单元 [星期索引 0–6, 小时 0–23, 强度] */
    private List<List<Integer>> heatmap;
    private List<String> heatmapDayLabels;
}
