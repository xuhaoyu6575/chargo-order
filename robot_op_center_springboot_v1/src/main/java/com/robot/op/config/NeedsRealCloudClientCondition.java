package com.robot.op.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.lang.NonNull;

/**
 * 当「Dashboard 走真实云平台」或「营收驾驶舱走云平台」任一成立时，注册 {@code CloudApiClientImpl} 与 {@link com.robot.op.service.CloudAuthService}。
 */
public class NeedsRealCloudClientCondition implements Condition {

    @Override
    public boolean matches(@NonNull ConditionContext context, @NonNull AnnotatedTypeMetadata metadata) {
        String dash = context.getEnvironment().getProperty("cloud.api.mock");
        boolean dashboardMock = dash == null || Boolean.parseBoolean(dash.trim());
        String rev = context.getEnvironment().getProperty("revenue.api.mock");
        boolean revenueMock = rev == null || Boolean.parseBoolean(rev.trim());
        return !dashboardMock || !revenueMock;
    }
}
