package com.robot.op.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 获取访问授权 token 请求体
 * authKey = MD5(sk+salt+timestamp)，salt=catl
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GetAuthTokenRequest {

    /** 签名：MD5(sk+catl+timestamp)，timestamp 与请求头一致 */
    private String authKey;
}
