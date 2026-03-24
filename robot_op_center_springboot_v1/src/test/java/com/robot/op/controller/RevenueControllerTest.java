package com.robot.op.controller;

import com.robot.op.client.dto.*;
import com.robot.op.common.GlobalExceptionHandler;
import com.robot.op.service.RevenueService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RevenueController.class)
@Import(GlobalExceptionHandler.class)
class RevenueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RevenueService revenueService;

    @Test
    @DisplayName("GET /api/revenue/cockpit - 返回结构化数据")
    void getCockpit() throws Exception {
        RevenueCockpitVO vo = RevenueCockpitVO.builder()
                .totalRevenue(320500)
                .avgOrderValue(105.5)
                .orderCount(3038)
                .trend(List.of(new RevenueTrendPoint("3月1", 12000)))
                .businessMix(List.of(
                        new RevenueMixItem("送电", 176275),
                        new RevenueMixItem("预约", 96150),
                        new RevenueMixItem("应急救援", 48075)))
                .topSites(List.of(new RevenueTopSite("港城广场", 176275)))
                .heatmap(List.of(List.of(0, 0, 10), List.of(1, 2, 20)))
                .heatmapDayLabels(List.of("Mon", "Tue"))
                .build();
        when(revenueService.getCockpit(isNull(), eq("30d"))).thenReturn(vo);

        mockMvc.perform(get("/api/revenue/cockpit").param("preset", "30d"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalRevenue").value(320500))
                .andExpect(jsonPath("$.data.avgOrderValue").value(105.5))
                .andExpect(jsonPath("$.data.trend").isArray())
                .andExpect(jsonPath("$.data.businessMix.length()").value(3))
                .andExpect(jsonPath("$.data.topSites").isArray())
                .andExpect(jsonPath("$.data.heatmap").isArray())
                .andExpect(jsonPath("$.data.heatmapDayLabels").isArray());
    }

    @Test
    @DisplayName("GET /api/revenue/cockpit - 非法 preset 400")
    void badPreset() throws Exception {
        when(revenueService.getCockpit(any(), eq("bad"))).thenThrow(new IllegalArgumentException("不支持的 preset"));

        mockMvc.perform(get("/api/revenue/cockpit").param("preset", "bad"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }
}
