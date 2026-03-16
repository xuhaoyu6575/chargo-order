package com.robot.op.client.impl;

import com.robot.op.client.CloudApiClient;
import com.robot.op.client.dto.OrderRecord;
import com.robot.op.client.dto.RobotRecord;
import com.robot.op.common.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * 真实实现：当 cloud.api.mock=false 时激活，通过 RestTemplate 调用外部云平台 HTTP 接口获取原始数据。
 * 云平台返回统一 Result<T> 格式，此处负责解包。
 */
@Component
@ConditionalOnProperty(name = "cloud.api.mock", havingValue = "false")
public class CloudApiClientImpl implements CloudApiClient {

    @Value("${cloud.api.base-url}")
    private String baseUrl;

    @Value("${cloud.api.key:}")
    private String apiKey;

    /** 去除末尾斜杠，防止拼接 URL 出现双斜杠 */
    private String baseUrl() {
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private final RestTemplate restTemplate;

    public CloudApiClientImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    private HttpEntity<Void> buildRequest() {
        HttpHeaders headers = new HttpHeaders();
        if (apiKey != null && !apiKey.isEmpty()) {
            headers.set("Authorization", "Bearer " + apiKey);
        }
        return new HttpEntity<>(headers);
    }

    @Override
    public List<OrderRecord> getOrders() {
        ResponseEntity<Result<List<OrderRecord>>> resp = restTemplate.exchange(
                baseUrl() + "/api/orders",
                HttpMethod.GET,
                buildRequest(),
                new ParameterizedTypeReference<>() {}
        );
        return unwrap(resp, "orders");
    }

    @Override
    public List<RobotRecord> getRobots() {
        ResponseEntity<Result<List<RobotRecord>>> resp = restTemplate.exchange(
                baseUrl() + "/api/robots",
                HttpMethod.GET,
                buildRequest(),
                new ParameterizedTypeReference<>() {}
        );
        return unwrap(resp, "robots");
    }

    @Override
    public List<Map<String, String>> getSites() {
        ResponseEntity<Result<List<Map<String, String>>>> resp = restTemplate.exchange(
                baseUrl() + "/api/sites",
                HttpMethod.GET,
                buildRequest(),
                new ParameterizedTypeReference<>() {}
        );
        return unwrap(resp, "sites");
    }

    private <T> T unwrap(ResponseEntity<Result<T>> resp, String name) {
        Result<T> result = resp.getBody();
        if (result == null || !Boolean.TRUE.equals(result.getSuccess())) {
            String msg = result != null ? result.getMsg() : "响应为空";
            throw new RuntimeException("获取" + name + "数据失败: " + msg);
        }
        T data = result.getData();
        if (data == null) {
            throw new RuntimeException("获取" + name + "数据失败: 云平台返回 data 为 null");
        }
        return data;
    }
}
