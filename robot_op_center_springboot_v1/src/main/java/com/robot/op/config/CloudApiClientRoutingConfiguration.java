package com.robot.op.config;

import com.robot.op.client.CloudApiClient;
import com.robot.op.client.impl.CloudApiClientImpl;
import com.robot.op.client.impl.MockCloudApiClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Dashboard 与营收驾驶舱分别注入不同的 {@link CloudApiClient}：
 * <ul>
 *   <li>{@code cloud.api.mock} 仅作用于 Dashboard</li>
 *   <li>{@code revenue.api.mock} 控制营收：{@code true}=Mock，{@code false}=真实 HTTP</li>
 * </ul>
 */
@Configuration
public class CloudApiClientRoutingConfiguration {

    @Bean
    public MockCloudApiClient mockCloudApiClient() {
        return new MockCloudApiClient();
    }

    @Bean
    @Qualifier(CloudApiClientQualifiers.DASHBOARD)
    public CloudApiClient dashboardCloudApiClient(
            @Value("${cloud.api.mock:true}") boolean dashboardMock,
            MockCloudApiClient mock,
            ObjectProvider<CloudApiClientImpl> real) {
        if (!dashboardMock) {
            return real.getObject();
        }
        return mock;
    }

    @Bean
    @Qualifier(CloudApiClientQualifiers.REVENUE)
    public CloudApiClient revenueCloudApiClient(
            @Value("${revenue.api.mock:true}") boolean revenueMock,
            MockCloudApiClient mock,
            ObjectProvider<CloudApiClientImpl> real) {
        if (!revenueMock) {
            return real.getObject();
        }
        return mock;
    }
}
