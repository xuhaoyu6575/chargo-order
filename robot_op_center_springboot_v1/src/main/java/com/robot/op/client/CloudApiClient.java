package com.robot.op.client;

import com.robot.op.client.dto.OrderRecord;
import com.robot.op.client.dto.RobotRecord;

import java.util.List;
import java.util.Map;

public interface CloudApiClient {

    List<OrderRecord> getOrders();

    List<RobotRecord> getRobots();

    /** 返回所有站点列表 [{id, name}] */
    List<Map<String, String>> getSites();
}
