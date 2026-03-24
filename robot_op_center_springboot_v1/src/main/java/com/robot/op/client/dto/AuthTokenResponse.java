package com.robot.op.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 云平台 getAuthToken 接口响应
 * code="0" 表示成功
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthTokenResponse {

    /** 返回码：0=成功 */
    private String code;

    private String msg;

    private String errorDetail;

    private Long timestamp;

    private AuthTokenData data;
}
