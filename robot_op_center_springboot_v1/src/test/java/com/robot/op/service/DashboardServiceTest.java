package com.robot.op.service;

import com.robot.op.client.CloudApiClient;
import com.robot.op.client.dto.OrderRecord;
import com.robot.op.client.dto.RobotRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private CloudApiClient cloudApiClient;

    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(cloudApiClient);
    }

    private List<OrderRecord> sampleOrders() {
        return List.of(
                OrderRecord.builder()
                        .orderId("O1").siteId("S001").daysAgo(0).dayOfWeek(1).timeSlot(16)
                        .endReason("NORMAL").estimatedKwh(30).actualKwh(32).userId("U001")
                        .responseMinutes(2).travelMinutes(5).plugInMinutes(3).chargeMinutes(45).plugOutMinutes(2).cancelMinutes(0)
                        .build(),
                OrderRecord.builder()
                        .orderId("O2").siteId("S001").daysAgo(1).dayOfWeek(0).timeSlot(20)
                        .endReason("NORMAL").estimatedKwh(20).actualKwh(15).userId("U001")
                        .responseMinutes(3).travelMinutes(6).plugInMinutes(2).chargeMinutes(30).plugOutMinutes(1).cancelMinutes(0)
                        .build(),
                OrderRecord.builder()
                        .orderId("O3").siteId("S001").daysAgo(2).dayOfWeek(2).timeSlot(16)
                        .endReason("USER_CANCEL").estimatedKwh(25).actualKwh(5).userId("U002")
                        .responseMinutes(4).travelMinutes(4).plugInMinutes(2).chargeMinutes(0).plugOutMinutes(0).cancelMinutes(10)
                        .build(),
                OrderRecord.builder()
                        .orderId("O4").siteId("S002").daysAgo(0).dayOfWeek(1).timeSlot(32)
                        .endReason("OPS_FORCE").estimatedKwh(40).actualKwh(10).userId("U003")
                        .responseMinutes(2).travelMinutes(5).plugInMinutes(3).chargeMinutes(5).plugOutMinutes(0).cancelMinutes(15)
                        .build(),
                OrderRecord.builder()
                        .orderId("O5").siteId("S001").daysAgo(10).dayOfWeek(3).timeSlot(8)
                        .endReason("NORMAL").estimatedKwh(35).actualKwh(38).userId("U001")
                        .responseMinutes(2).travelMinutes(5).plugInMinutes(3).chargeMinutes(50).plugOutMinutes(2).cancelMinutes(0)
                        .build()
        );
    }

    private List<RobotRecord> sampleRobots() {
        return List.of(
                new RobotRecord("V1", "S001", true),
                new RobotRecord("V2", "S001", false),
                new RobotRecord("V3", "S001", true),
                new RobotRecord("V4", "S002", true)
        );
    }

    @Nested
    @DisplayName("getStats - 总览指标")
    class GetStatsTests {

        @Test
        void shouldReturnTotalOrdersKwhAndActiveRobots() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> result = dashboardService.getStats(null, 30);

            assertThat(result).containsEntry("totalOrders", 5);
            assertThat(result).containsEntry("totalKwh", 100L); // 32+15+5+10+38
            assertThat(result).containsEntry("activeRobots", 3);
        }

        @Test
        void shouldFilterBySiteId() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> result = dashboardService.getStats("S001", 30);

            assertThat(result).containsEntry("totalOrders", 4); // O1,O2,O3,O5
            assertThat(result).containsEntry("activeRobots", 2); // S001 的 active robots
        }

        @Test
        void shouldFilterByDays() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> result = dashboardService.getStats(null, 3);

            assertThat(result).containsEntry("totalOrders", 4); // daysAgo 0,1,2 在 3 天内
        }

        @Test
        void shouldReturnZeroWhenNoOrders() {
            when(cloudApiClient.getOrders()).thenReturn(Collections.emptyList());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> result = dashboardService.getStats(null, 30);

            assertThat(result).containsEntry("totalOrders", 0);
            assertThat(result).containsEntry("totalKwh", 0L);
        }
    }

    @Nested
    @DisplayName("getCompletionRate - 完单率")
    class GetCompletionRateTests {

        @Test
        void shouldCalculateSatisfiedAndUnsatisfied() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());

            Map<String, Object> result = dashboardService.getCompletionRate(null, 30);

            // O1: 32>=30 ✓, O2: 15>=20 ✗, O3: 5>=25 ✗, O4: 10>=40 ✗, O5: 38>=35 ✓ → 2 satisfied
            assertThat(result).containsEntry("satisfied", 2);
            assertThat(result).containsEntry("unsatisfied", 3);
            assertThat(result.get("rate")).isEqualTo("40%");
        }

        @Test
        void shouldReturnZeroRateWhenEmpty() {
            when(cloudApiClient.getOrders()).thenReturn(Collections.emptyList());

            Map<String, Object> result = dashboardService.getCompletionRate(null, 30);

            assertThat(result).containsEntry("satisfied", 0);
            assertThat(result).containsEntry("unsatisfied", 0);
            assertThat(result.get("rate")).isEqualTo("0%");
        }
    }

    @Nested
    @DisplayName("getEndReasons - 结束原因分布")
    class GetEndReasonsTests {

        @Test
        void shouldReturnEndReasonsSortedByCount() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());

            List<Map<String, Object>> result = dashboardService.getEndReasons(null, 30);

            assertThat(result).isNotEmpty();
            // NORMAL=3 (O1,O2,O5), USER_CANCEL=1, OPS_FORCE=1
            assertThat(result.get(0)).containsEntry("name", "正常结束").containsEntry("value", 3);
        }

        @Test
        void shouldFilterBySiteId() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());

            List<Map<String, Object>> result = dashboardService.getEndReasons("S002", 30);

            assertThat(result).hasSize(1);
            assertThat(result.get(0)).containsEntry("name", "运营强制结束").containsEntry("value", 1);
        }
    }

    @Nested
    @DisplayName("getHeatmap - 24小时订单热力图")
    class GetHeatmapTests {

        @Test
        void shouldReturnHeatmapData() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());

            List<int[]> result = dashboardService.getHeatmap(null, 30);

            assertThat(result).hasSize(7 * 48);
            // 每个元素 [slot, day, normalized]
            assertThat(result.get(0)).hasSize(3);
        }

        @Test
        void shouldSkipOutOfBoundsOrders() {
            List<OrderRecord> orders = List.of(
                    OrderRecord.builder().orderId("O1").siteId("S1").daysAgo(0).dayOfWeek(0).timeSlot(0).endReason("NORMAL")
                            .estimatedKwh(10).actualKwh(10).userId("U1")
                            .responseMinutes(1).travelMinutes(1).plugInMinutes(1).chargeMinutes(1).plugOutMinutes(1).cancelMinutes(0)
                            .build(),
                    OrderRecord.builder().orderId("O2").siteId("S1").daysAgo(0).dayOfWeek(10).timeSlot(50).endReason("NORMAL")
                            .estimatedKwh(10).actualKwh(10).userId("U1")
                            .responseMinutes(1).travelMinutes(1).plugInMinutes(1).chargeMinutes(1).plugOutMinutes(1).cancelMinutes(0)
                            .build()
            );
            when(cloudApiClient.getOrders()).thenReturn(orders);

            List<int[]> result = dashboardService.getHeatmap(null, 7);

            assertThat(result).hasSize(7 * 48);
        }
    }

    @Nested
    @DisplayName("getProcessTime - 平均服务流程耗时")
    class GetProcessTimeTests {

        @Test
        void shouldReturnAvgStages() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());

            Map<String, Object> result = dashboardService.getProcessTime(null, 30);

            assertThat(result).containsKey("avgTotal");
            assertThat(result).containsKey("stages");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> stages = (List<Map<String, Object>>) result.get("stages");
            assertThat(stages).hasSize(5);
            assertThat(stages.get(0)).containsKeys("name", "value", "subProcess");
        }

        @Test
        void shouldReturnZeroWhenEmpty() {
            when(cloudApiClient.getOrders()).thenReturn(Collections.emptyList());

            Map<String, Object> result = dashboardService.getProcessTime(null, 30);

            assertThat(result).containsEntry("avgTotal", 0);
        }
    }

    @Nested
    @DisplayName("getCancelAnalysis - 订单取消分析")
    class GetCancelAnalysisTests {

        @Test
        void shouldReturnCancelTypesAndAvgMinutes() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());

            Map<String, Object> result = dashboardService.getCancelAnalysis(null, 30);

            assertThat(result).containsKey("types");
            assertThat(result).containsKey("avgCancelMinutes");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> types = (List<Map<String, Object>>) result.get("types");
            assertThat(types).isNotEmpty();
            // USER_CANCEL=1, OPS_FORCE=1, ROBOT_FAILURE+OTHER=0
            assertThat(result.get("avgCancelMinutes")).isInstanceOf(Integer.class);
        }
    }

    @Nested
    @DisplayName("getUserFrequency - 用户充电频次")
    class GetUserFrequencyTests {

        @Test
        void shouldReturnUserFrequencyBuckets() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());

            Map<String, Object> result = dashboardService.getUserFrequency(null, 30);

            assertThat(result).containsKey("totalUsers");
            assertThat(result).containsKey("data");
            // U001: 3次, U002: 1次, U003: 1次
            assertThat(result.get("totalUsers")).isEqualTo(3);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> data = (List<Map<String, Object>>) result.get("data");
            assertThat(data).hasSize(4);
            assertThat(data.get(0)).containsKeys("label", "value");
        }
    }

    @Nested
    @DisplayName("getSites - 站点列表")
    class GetSitesTests {

        @Test
        void shouldDelegateToCloudApiClient() {
            List<Map<String, String>> sites = List.of(
                    Map.of("id", "S001", "name", "港城广场"),
                    Map.of("id", "S002", "name", "临港基地")
            );
            when(cloudApiClient.getSites()).thenReturn(sites);

            List<Map<String, String>> result = dashboardService.getSites();

            assertThat(result).isEqualTo(sites);
        }
    }

    @Nested
    @DisplayName("站点与时间区间检索")
    class SiteAndTimeRangeFilterTests {

        /** sampleOrders: O1(S001,d0), O2(S001,d1), O3(S001,d2), O4(S002,d0), O5(S001,d10) */
        @Test
        @DisplayName("站点: null/空 返回全部站点数据")
        void siteIdNullOrEmptyReturnsAllSites() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> nullResult = dashboardService.getStats(null, 30);
            Map<String, Object> emptyResult = dashboardService.getStats("", 30);

            assertThat(nullResult).containsEntry("totalOrders", 5);
            assertThat(emptyResult).containsEntry("totalOrders", 5);
        }

        @Test
        @DisplayName("站点: S001 只返回该站点订单")
        void siteIdS001FiltersCorrectly() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> stats = dashboardService.getStats("S001", 30);
            Map<String, Object> completion = dashboardService.getCompletionRate("S001", 30);
            List<Map<String, Object>> reasons = dashboardService.getEndReasons("S001", 30);
            Map<String, Object> freq = dashboardService.getUserFrequency("S001", 30);

            assertThat(stats).containsEntry("totalOrders", 4); // O1,O2,O3,O5
            assertThat(stats).containsEntry("activeRobots", 2);
            assertThat(completion).containsEntry("satisfied", 2).containsEntry("unsatisfied", 2);
            assertThat(reasons).noneMatch(m -> "运营强制结束".equals(m.get("name"))); // O4 被过滤
            assertThat(freq).containsEntry("totalUsers", 2); // U001,U002
        }

        @Test
        @DisplayName("站点: S002 只返回该站点订单")
        void siteIdS002FiltersCorrectly() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> stats = dashboardService.getStats("S002", 30);
            Map<String, Object> completion = dashboardService.getCompletionRate("S002", 30);

            assertThat(stats).containsEntry("totalOrders", 1); // O4
            assertThat(stats).containsEntry("activeRobots", 1);
            assertThat(completion).containsEntry("satisfied", 0).containsEntry("unsatisfied", 1);
        }

        @Test
        @DisplayName("站点: 无匹配站点返回空")
        void siteIdNoMatchReturnsEmpty() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> stats = dashboardService.getStats("S999", 30);
            Map<String, Object> completion = dashboardService.getCompletionRate("S999", 30);

            assertThat(stats).containsEntry("totalOrders", 0);
            assertThat(completion).containsEntry("satisfied", 0).containsEntry("unsatisfied", 0);
        }

        @Test
        @DisplayName("时间区间: days=1 只含今天")
        void days1OnlyToday() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> result = dashboardService.getStats(null, 1);

            assertThat(result).containsEntry("totalOrders", 2); // O1(d0), O4(d0)
        }

        @Test
        @DisplayName("时间区间: days=3 含近3天")
        void days3LastThreeDays() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> result = dashboardService.getStats(null, 3);

            assertThat(result).containsEntry("totalOrders", 4); // O1,O2,O3,O4 (daysAgo 0,1,2)
        }

        @Test
        @DisplayName("时间区间: days=7 含近7天")
        void days7LastSevenDays() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> result = dashboardService.getStats(null, 7);

            assertThat(result).containsEntry("totalOrders", 4); // O1,O2,O3,O4 (daysAgo 0..6, O5的d10排除)
        }

        @Test
        @DisplayName("时间区间: days=11 含近11天")
        void days11IncludesO5() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> result = dashboardService.getStats(null, 11);

            assertThat(result).containsEntry("totalOrders", 5); // O5 daysAgo=10 被包含
        }

        @Test
        @DisplayName("站点+时间区间组合: S001 且 days=3")
        void siteAndDaysCombined() {
            when(cloudApiClient.getOrders()).thenReturn(sampleOrders());
            when(cloudApiClient.getRobots()).thenReturn(sampleRobots());

            Map<String, Object> result = dashboardService.getStats("S001", 3);

            assertThat(result).containsEntry("totalOrders", 3); // O1,O2,O3 (S001 且 daysAgo<3)
        }
    }
}
