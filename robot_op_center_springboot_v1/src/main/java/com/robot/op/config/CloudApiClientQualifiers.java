package com.robot.op.config;

/**
 * {@link com.robot.op.client.CloudApiClient} 多实现时的注入限定符。
 */
public final class CloudApiClientQualifiers {

    public static final String DASHBOARD = "dashboardCloudApiClient";
    public static final String REVENUE = "revenueCloudApiClient";

    private CloudApiClientQualifiers() {
    }
}
