package com.robot.op.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * getAuthToken 响应 data 节点
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthTokenData {

    /** 令牌，用于计算 lmt-auth-token */
    private String token;

    /** Token 失效时间：13 位 unix 毫秒时间戳 */
    private Long expireTime;
}
