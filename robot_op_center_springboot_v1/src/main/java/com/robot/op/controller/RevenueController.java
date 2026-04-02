package com.robot.op.controller;

import com.robot.op.client.dto.RevenueCockpitVO;
import com.robot.op.common.Result;
import com.robot.op.service.RevenueService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 营收驾驶舱 API；数据由 {@code revenue.api.mock}（true/false）控制，与 Dashboard 的 {@code cloud.api.mock} 独立。
 * <p>
 * 云平台对接以 {@code GET /api/revenue/cockpit} 聚合营收数据为准（见仓库 {@code cloud_api/cloud_API_doc.md} §4）；
 * 字段映射与口径等元数据为文档约定（同文档附录 B），不要求单独元数据/枚举 HTTP 接口。
 */
@Slf4j
@RestController
@RequestMapping("/api/revenue")
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class RevenueController {

    private final RevenueService revenueService;

    public RevenueController(RevenueService revenueService) {
        this.revenueService = revenueService;
    }

    /**
     * 营收驾驶舱聚合数据（订单聚合 + 无数据时仿真）。查询参数与云平台 {@code /api/revenue/cockpit} 对齐：
     * {@code siteId}、{@code preset}（today / yesterday / 7d / 30d / mtd）；云平台可选扩展 {@code beginDate}/{@code endDate}。
     */
    @GetMapping("/cockpit")
    public Result<RevenueCockpitVO> getCockpit(
            @RequestParam(required = false) String siteId,
            @RequestParam(defaultValue = "30d") String preset) {
        log.info("营收驾驶舱 siteId={} preset={}", siteLabel(siteId), preset);
        return Result.success(revenueService.getCockpit(siteId, preset));
    }

    private static String siteLabel(String siteId) {
        return siteId == null || siteId.isEmpty() ? "(全部)" : siteId;
    }
}
