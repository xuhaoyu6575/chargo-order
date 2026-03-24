package com.robot.op.controller;

import com.robot.op.common.GlobalExceptionHandler;
import com.robot.op.service.DashboardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DashboardController.class)
@Import(GlobalExceptionHandler.class)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @Test
    @DisplayName("GET /api/dashboard/sites - 站点列表")
    void getSites() throws Exception {
        List<Map<String, String>> sites = List.of(
                Map.of("id", "S001", "name", "港城广场"),
                Map.of("id", "S002", "name", "临港基地")
        );
        when(dashboardService.getSites()).thenReturn(sites);

        mockMvc.perform(get("/api/dashboard/sites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].id").value("S001"))
                .andExpect(jsonPath("$.data[0].name").value("港城广场"));
    }

    @Test
    @DisplayName("GET /api/dashboard/stats - 总览指标")
    void getStats() throws Exception {
        Map<String, Object> stats = Map.of(
                "totalOrders", 100,
                "totalKwh", 2500L,
                "activeRobots", 15
        );
        when(dashboardService.getStats(any(), anyInt())).thenReturn(stats);

        mockMvc.perform(get("/api/dashboard/stats").param("days", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalOrders").value(100))
                .andExpect(jsonPath("$.data.totalKwh").value(2500))
                .andExpect(jsonPath("$.data.activeRobots").value(15));
    }

    @Test
    @DisplayName("GET /api/dashboard/stats - 支持 siteId 参数")
    void getStatsWithSiteId() throws Exception {
        Map<String, Object> stats = Map.of("totalOrders", 40, "totalKwh", 1000L, "activeRobots", 5);
        when(dashboardService.getStats(eq("S001"), eq(7))).thenReturn(stats);

        mockMvc.perform(get("/api/dashboard/stats")
                        .param("siteId", "S001")
                        .param("days", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalOrders").value(40));
    }

    @Test
    @DisplayName("GET /api/dashboard/* - 站点+时间区间参数透传")
    void siteIdAndDaysParamsPassedToService() throws Exception {
        when(dashboardService.getCompletionRate(eq("S002"), eq(14))).thenReturn(
                Map.of("satisfied", 10, "unsatisfied", 5, "rate", "67%"));
        when(dashboardService.getEndReasons(eq("S002"), eq(14))).thenReturn(
                List.of(Map.of("name", "正常结束", "value", 10)));

        mockMvc.perform(get("/api/dashboard/completion-rate")
                        .param("siteId", "S002")
                        .param("days", "14"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.satisfied").value(10));

        mockMvc.perform(get("/api/dashboard/end-reasons")
                        .param("siteId", "S002")
                        .param("days", "14"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("正常结束"));
    }

    @Test
    @DisplayName("GET /api/dashboard/completion-rate - 完单率")
    void getCompletionRate() throws Exception {
        Map<String, Object> rate = Map.of("satisfied", 85, "unsatisfied", 15, "rate", "85%");
        when(dashboardService.getCompletionRate(any(), anyInt())).thenReturn(rate);

        mockMvc.perform(get("/api/dashboard/completion-rate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.satisfied").value(85))
                .andExpect(jsonPath("$.data.rate").value("85%"));
    }

    @Test
    @DisplayName("GET /api/dashboard/end-reasons - 结束原因分布")
    void getEndReasons() throws Exception {
        List<Map<String, Object>> reasons = List.of(
                Map.of("name", "正常结束", "value", 500),
                Map.of("name", "用户取消", "value", 80)
        );
        when(dashboardService.getEndReasons(any(), anyInt())).thenReturn(reasons);

        mockMvc.perform(get("/api/dashboard/end-reasons"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].name").value("正常结束"))
                .andExpect(jsonPath("$.data[0].value").value(500));
    }

    @Test
    @DisplayName("GET /api/dashboard/heatmap - 热力图")
    void getHeatmap() throws Exception {
        List<int[]> heatmap = List.of(new int[]{0, 0, 50}, new int[]{1, 0, 30});
        when(dashboardService.getHeatmap(any(), anyInt())).thenReturn(heatmap);

        mockMvc.perform(get("/api/dashboard/heatmap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0]").isArray());
    }

    @Test
    @DisplayName("GET /api/dashboard/process-time - 流程耗时")
    void getProcessTime() throws Exception {
        Map<String, Object> processTime = Map.of(
                "avgTotal", 60,
                "stages", List.of(
                        Map.of("name", "响应耗时", "value", 2, "subProcess", "派单-下单")
                )
        );
        when(dashboardService.getProcessTime(any(), anyInt())).thenReturn(processTime);

        mockMvc.perform(get("/api/dashboard/process-time"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avgTotal").value(60))
                .andExpect(jsonPath("$.data.stages").isArray());
    }

    @Test
    @DisplayName("GET /api/dashboard/cancel-analysis - 取消分析")
    void getCancelAnalysis() throws Exception {
        Map<String, Object> cancel = Map.of(
                "types", List.of(Map.of("name", "主动", "value", 20)),
                "avgCancelMinutes", 12
        );
        when(dashboardService.getCancelAnalysis(any(), anyInt())).thenReturn(cancel);

        mockMvc.perform(get("/api/dashboard/cancel-analysis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avgCancelMinutes").value(12));
    }

    @Test
    @DisplayName("GET /api/dashboard/user-frequency - 用户频次")
    void getUserFrequency() throws Exception {
        Map<String, Object> freq = Map.of(
                "totalUsers", 200,
                "data", List.of(
                        Map.of("label", "1次", "value", 100),
                        Map.of("label", "2次", "value", 50)
                )
        );
        when(dashboardService.getUserFrequency(any(), anyInt())).thenReturn(freq);

        mockMvc.perform(get("/api/dashboard/user-frequency"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUsers").value(200))
                .andExpect(jsonPath("$.data.data").isArray());
    }

    @Test
    @DisplayName("days 参数超出范围应返回 code=400")
    void getStatsInvalidDays() throws Exception {
        mockMvc.perform(get("/api/dashboard/stats").param("days", "400"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.success").value(false));
    }
}
