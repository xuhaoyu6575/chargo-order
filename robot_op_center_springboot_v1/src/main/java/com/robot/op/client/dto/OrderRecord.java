package com.robot.op.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRecord {

    private String orderId;
    private String siteId;

    /** 距今天数：0=今天, 1=昨天, … 29=30天前 */
    private int daysAgo;

    /** 星期几：0=Mon, 1=Tue, … 6=Sun */
    private int dayOfWeek;

    /** 一天内的半小时时间槽：0=00:00, 1=00:30, … 47=23:30 */
    private int timeSlot;

    /**
     * 结束原因编码：
     * NORMAL / USER_CANCEL / ROBOT_FAILURE / VEHICLE_FULL / OPS_FORCE / OTHER
     */
    private String endReason;

    private double estimatedKwh;
    private double actualKwh;
    private String userId;

    private int responseMinutes;
    private int travelMinutes;
    private int plugInMinutes;
    private int chargeMinutes;
    private int plugOutMinutes;
    private int cancelMinutes;

    /** 订单营收（元） */
    private double revenueYuan;

    /** DELIVERY / BOOKING / EMERGENCY */
    private String businessType;
}
