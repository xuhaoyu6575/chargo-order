package com.robot.op.controller;

import com.robot.op.common.Result;
import com.robot.op.service.DashboardService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class DashboardController {

    /** days 参数允许的最大值，防止全量扫描 */
    private static final int MAX_DAYS = 365;
    private static final int MIN_DAYS = 1;

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/sites")
    public Result<List<Map<String, String>>> getSites() {
        return Result.success(dashboardService.getSites());
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats(
            @RequestParam(required = false) String siteId,
            @RequestParam(defaultValue = "7") int days) {
        validateDays(days);
        return Result.success(dashboardService.getStats(siteId, days));
    }

    @GetMapping("/completion-rate")
    public Result<Map<String, Object>> getCompletionRate(
            @RequestParam(required = false) String siteId,
            @RequestParam(defaultValue = "7") int days) {
        validateDays(days);
        return Result.success(dashboardService.getCompletionRate(siteId, days));
    }

    @GetMapping("/end-reasons")
    public Result<List<Map<String, Object>>> getEndReasons(
            @RequestParam(required = false) String siteId,
            @RequestParam(defaultValue = "7") int days) {
        validateDays(days);
        return Result.success(dashboardService.getEndReasons(siteId, days));
    }

    @GetMapping("/heatmap")
    public Result<List<int[]>> getHeatmap(
            @RequestParam(required = false) String siteId,
            @RequestParam(defaultValue = "7") int days) {
        validateDays(days);
        return Result.success(dashboardService.getHeatmap(siteId, days));
    }

    @GetMapping("/process-time")
    public Result<Map<String, Object>> getProcessTime(
            @RequestParam(required = false) String siteId,
            @RequestParam(defaultValue = "7") int days) {
        validateDays(days);
        return Result.success(dashboardService.getProcessTime(siteId, days));
    }

    @GetMapping("/cancel-analysis")
    public Result<Map<String, Object>> getCancelAnalysis(
            @RequestParam(required = false) String siteId,
            @RequestParam(defaultValue = "7") int days) {
        validateDays(days);
        return Result.success(dashboardService.getCancelAnalysis(siteId, days));
    }

    @GetMapping("/user-frequency")
    public Result<Map<String, Object>> getUserFrequency(
            @RequestParam(required = false) String siteId,
            @RequestParam(defaultValue = "7") int days) {
        validateDays(days);
        return Result.success(dashboardService.getUserFrequency(siteId, days));
    }

    private static void validateDays(int days) {
        if (days < MIN_DAYS || days > MAX_DAYS) {
            throw new IllegalArgumentException(
                    "days 参数超出范围，允许值为 " + MIN_DAYS + "~" + MAX_DAYS + "，当前值: " + days);
        }
    }
}
