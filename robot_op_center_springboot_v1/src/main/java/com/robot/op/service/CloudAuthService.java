package com.robot.op.service;

import com.robot.op.client.dto.AuthTokenData;
import com.robot.op.client.dto.AuthTokenResponse;
import com.robot.op.client.dto.GetAuthTokenRequest;
import lombok.extern.slf4j.Slf4j;
import com.robot.op.config.NeedsRealCloudClientCondition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Conditional;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 云平台认证服务：获取 token，并在业务接口请求头中提供 appKey、timestamp、lmt-auth-token
 */
@Slf4j
@Service
@Conditional(NeedsRealCloudClientCondition.class)
public class CloudAuthService {

    private static final String SALT = "catl";
    private static final long REFRESH_BUFFER_MS = 5 * 60 * 1000; // 提前 5 分钟刷新

    @Value("${cloud.api.base-url}")
    private String baseUrl;

    @Value("${cloud.api.ak}")
    private String ak;

    @Value("${cloud.api.sk}")
    private String sk;

    private final RestTemplate restTemplate;

    private volatile AuthTokenData cached;
    private volatile long cachedAt;

    public CloudAuthService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * 获取业务接口所需的认证请求头
     */
    public HttpHeaders getAuthHeaders() {
        AuthTokenData tokenData = ensureToken();
        long timestamp = System.currentTimeMillis();
        String lmtAuthToken = md5(tokenData.getToken() + sk + timestamp);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("reqId", nextReqId());
        headers.set("appKey", ak);
        headers.set("timestamp", String.valueOf(timestamp));
        headers.set("lmt-auth-token", lmtAuthToken);
        if (log.isTraceEnabled()) {
            log.trace("组装业务请求头 reqId={} appKey={} timestamp={} (lmt-auth-token 已省略)",
                    headers.getFirst("reqId"), maskAk(ak), timestamp);
        }
        return headers;
    }

    /** 日志中仅保留 AK 尾部，避免完整泄露 */
    private static String maskAk(String ak) {
        if (ak == null || ak.isEmpty()) {
            return "(empty)";
        }
        if (ak.length() <= 6) {
            return "***";
        }
        return "…" + ak.substring(ak.length() - 4);
    }

    /**
     * 获取 getAuthToken 接口所需的请求头（不含 lmt-auth-token）
     */
    private HttpHeaders getTokenRequestHeaders(long timestamp) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("reqId", nextReqId());
        headers.set("appKey", ak);
        headers.set("timestamp", String.valueOf(timestamp));
        return headers;
    }

    private AuthTokenData ensureToken() {
        long now = System.currentTimeMillis();
        if (cached != null && cached.getExpireTime() != null
                && cached.getExpireTime() - now > REFRESH_BUFFER_MS) {
            log.trace("使用缓存的云平台 token");
            return cached;
        }
        synchronized (this) {
            if (cached != null && cached.getExpireTime() != null
                    && cached.getExpireTime() - now > REFRESH_BUFFER_MS) {
                return cached;
            }
            log.info("正在向云平台请求新的 access token");
            cached = fetchToken();
            cachedAt = now;
            return cached;
        }
    }

    private AuthTokenData fetchToken() {
        long timestamp = System.currentTimeMillis();
        String authKey = md5(sk + SALT + timestamp);

        String url = baseUrl().replaceAll("/$", "") + "/openApi/auth/getAuthToken";
        log.info("云平台鉴权: POST /openApi/auth/getAuthToken baseUrl={} appKey={}",
                baseUrl(), maskAk(ak));
        GetAuthTokenRequest body = new GetAuthTokenRequest(authKey);
        HttpEntity<GetAuthTokenRequest> entity = new HttpEntity<>(body, getTokenRequestHeaders(timestamp));

        long t0 = System.currentTimeMillis();
        try {
            ResponseEntity<AuthTokenResponse> resp = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    AuthTokenResponse.class
            );
            long elapsed = System.currentTimeMillis() - t0;
            AuthTokenResponse result = resp.getBody();
            if (result == null || !"0".equals(result.getCode())) {
                String msg = result != null ? result.getMsg() : "响应为空";
                String code = result != null ? String.valueOf(result.getCode()) : "null";
                log.warn("云平台 getAuthToken 业务失败 code={} msg={} 耗时={}ms", code, msg, elapsed);
                throw new RuntimeException("获取 token 失败: " + msg);
            }
            AuthTokenData data = result.getData();
            if (data == null || data.getToken() == null) {
                log.warn("云平台 getAuthToken 成功但 data/token 为空 耗时={}ms", elapsed);
                throw new RuntimeException("获取 token 失败: data 为空");
            }
            log.info("云平台 token 获取成功 expireTime={} 耗时={}ms (token 内容不记录日志)",
                    data.getExpireTime(), elapsed);
            return data;
        } catch (RestClientException e) {
            long elapsed = System.currentTimeMillis() - t0;
            log.error("云平台 getAuthToken HTTP/网络异常 耗时={}ms url={}", elapsed, url, e);
            throw new RuntimeException("获取 token 网络异常: " + e.getMessage(), e);
        }
    }

    private String baseUrl() {
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    /** reqId 最长 32 位 */
    private String nextReqId() {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rnd = ThreadLocalRandom.current().nextInt(10000, 100000);
        String id = "req_" + time + "_" + rnd;
        return id.length() > 32 ? id.substring(0, 32) : id;
    }

    private static String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(32);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 not available", e);
        }
    }
}
