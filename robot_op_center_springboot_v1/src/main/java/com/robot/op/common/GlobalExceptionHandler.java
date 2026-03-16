package com.robot.op.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 参数校验失败 — 400，异常信息可安全返回给前端（业务提示，非内部细节）
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public Result<Void> handleIllegalArgument(IllegalArgumentException e) {
        log.warn("参数校验失败: {}", e.getMessage());
        return Result.error(400, "参数错误", e.getMessage());
    }

    /**
     * 兜底异常 — 500，只返回通用提示，内部详情仅写入日志，不透露给客户端
     */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("接口异常", e);
        return Result.error(500, "服务器内部错误");
    }
}
