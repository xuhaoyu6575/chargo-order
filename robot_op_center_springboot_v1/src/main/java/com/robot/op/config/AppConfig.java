package com.robot.op.config;

import com.robot.op.client.http.CloudHttpLoggingInterceptor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Slf4j
@Configuration
public class AppConfig {

    /** 连接超时（毫秒），默认 5s */
    @Value("${cloud.api.connect-timeout-ms:5000}")
    private int connectTimeoutMs;

    /** 读取超时（毫秒），默认 30s */
    @Value("${cloud.api.read-timeout-ms:30000}")
    private int readTimeoutMs;

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        log.debug("RestTemplate 超时: connect={}ms read={}ms", connectTimeoutMs, readTimeoutMs);
        RestTemplate restTemplate = new RestTemplate(factory);
        restTemplate.setInterceptors(List.of(new CloudHttpLoggingInterceptor()));
        return restTemplate;
    }
}
