package com.robot.op.service;

import com.robot.op.client.CloudApiClient;
import com.robot.op.client.dto.OrderRecord;
import com.robot.op.client.dto.RevenueCockpitVO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RevenueServiceTest {

    @Mock
    private CloudApiClient cloudApiClient;

    @Test
    @DisplayName("无订单时返回仿真数据且字段完整")
    void simulatedWhenNoOrders() {
        when(cloudApiClient.getOrders()).thenReturn(Collections.emptyList());

        RevenueService svc = new RevenueService(cloudApiClient);
        RevenueCockpitVO vo = svc.getCockpit(null, "30d");

        assertThat(vo.getTotalRevenue()).isPositive();
        assertThat(vo.getTrend()).isNotEmpty();
        assertThat(vo.getBusinessMix()).hasSize(3);
        assertThat(vo.getTopSites()).isNotEmpty();
        assertThat(vo.getHeatmap()).hasSize(24 * 7);
        assertThat(vo.getHeatmapDayLabels()).hasSize(7);
    }

    @Test
    @DisplayName("有订单时从订单聚合")
    void aggregateFromOrders() {
        List<OrderRecord> orders = List.of(
                OrderRecord.builder()
                        .orderId("1")
                        .siteId("S001")
                        .daysAgo(0)
                        .dayOfWeek(1)
                        .timeSlot(20)
                        .endReason("NORMAL")
                        .actualKwh(10)
                        .revenueYuan(100)
                        .businessType("DELIVERY")
                        .build()
        );
        when(cloudApiClient.getOrders()).thenReturn(orders);
        when(cloudApiClient.getSites()).thenReturn(List.of(Map.of("id", "S001", "name", "港城广场")));

        RevenueService svc = new RevenueService(cloudApiClient);
        RevenueCockpitVO vo = svc.getCockpit(null, "7d");

        assertThat(vo.getTotalRevenue()).isEqualTo(100);
        assertThat(vo.getOrderCount()).isEqualTo(1);
        assertThat(vo.getTopSites().get(0).getName()).isEqualTo("港城广场");
    }
}
