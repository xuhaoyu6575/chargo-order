package com.robot.op.client.http;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

import java.io.IOException;
import java.net.URI;

/**
 * 云平台 HTTP 出站日志：记录方法、路径、状态码与耗时；不记录请求体与 lmt-auth-token，避免泄露密钥与隐私。
 */
@Slf4j
public class CloudHttpLoggingInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(
            HttpRequest request,
            byte[] body,
            ClientHttpRequestExecution execution) throws IOException {
        long startNs = System.nanoTime();
        String method = request.getMethod().name();
        URI uri = request.getURI();
        String path = safePath(uri);
        int bodyLen = body == null ? 0 : body.length;

        if (log.isDebugEnabled()) {
            log.debug("云平台HTTP 请求 {} {} bodyBytes={}", method, uri, bodyLen);
        }

        try {
            ClientHttpResponse response = execution.execute(request, body);
            long ms = (System.nanoTime() - startNs) / 1_000_000L;
            int status = response.getStatusCode().value();
            log.info("云平台HTTP {} {} -> {} 耗时={}ms", method, path, status, ms);
            return response;
        } catch (IOException e) {
            long ms = (System.nanoTime() - startNs) / 1_000_000L;
            log.error("云平台HTTP IO异常 {} {} 耗时={}ms", method, uri, ms, e);
            throw e;
        } catch (RuntimeException e) {
            long ms = (System.nanoTime() - startNs) / 1_000_000L;
            log.error("云平台HTTP 异常 {} {} 耗时={}ms", method, uri, ms, e);
            throw e;
        }
    }

    private static String safePath(URI uri) {
        if (uri == null) {
            return "";
        }
        String path = uri.getPath();
        return path != null && !path.isEmpty() ? path : uri.toString();
    }
}
