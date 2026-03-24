package com.robot.op.controller;

import com.robot.op.client.dto.RevenueCockpitVO;
import com.robot.op.common.Result;
import com.robot.op.service.RevenueService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/revenue")
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class RevenueController {

    private final RevenueService revenueService;

    public RevenueController(RevenueService revenueService) {
        this.revenueService = revenueService;
    }

    /**
     * 营收驾驶舱聚合数据（订单聚合 + 无数据时仿真），与前端 preset 对齐：today / yesterday / 7d / 30d / mtd
     */
    @GetMapping("/cockpit")
    public Result<RevenueCockpitVO> getCockpit(
            @RequestParam(required = false) String siteId,
            @RequestParam(defaultValue = "30d") String preset) {
        return Result.success(revenueService.getCockpit(siteId, preset));
    }
}
