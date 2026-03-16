package com.robot.op.common;

import lombok.Data;

import java.io.Serializable;

/**
 * 统一接口返回结果
 *
 * @param <T> 业务数据类型
 */
@Data
public class Result<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private static final int CODE_SUCCESS = 200;
    private static final int CODE_ERROR = 500;

    /** 状态码：200=成功，500=服务端异常，4xx=客户端异常 */
    private Integer code;

    /** 是否成功 */
    private Boolean success;

    /** 提示信息 */
    private String msg;

    /** 详细错误信息（仅失败时有值） */
    private String msgDetail;

    /** 业务数据 */
    private T data;

    /** 时间戳 */
    private Long timestamp;

    private Result() {
        this.timestamp = System.currentTimeMillis();
    }

    // ==================== 成功 ====================

    public static <T> Result<T> success() {
        Result<T> r = new Result<>();
        r.code = CODE_SUCCESS;
        r.success = true;
        r.msg = "操作成功";
        return r;
    }

    public static <T> Result<T> success(T data) {
        Result<T> r = success();
        r.data = data;
        return r;
    }

    public static <T> Result<T> success(T data, String msg) {
        Result<T> r = success();
        r.data = data;
        r.msg = msg;
        return r;
    }

    // ==================== 失败 ====================

    public static <T> Result<T> error(String msg) {
        Result<T> r = new Result<>();
        r.code = CODE_ERROR;
        r.success = false;
        r.msg = msg;
        return r;
    }

    public static <T> Result<T> error(int code, String msg) {
        Result<T> r = new Result<>();
        r.code = code;
        r.success = false;
        r.msg = msg;
        return r;
    }

    public static <T> Result<T> error(int code, String msg, String msgDetail) {
        Result<T> r = error(code, msg);
        r.msgDetail = msgDetail;
        return r;
    }
}
