package com.robot.op.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * 云平台分页请求体
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloudPageRequest {

    private Integer pageNo;
    private Integer pageSize;
    private String siteId;
    private String beginDate;
    private String endDate;

    public Map<String, Object> toMap() {
        Map<String, Object> m = new HashMap<>();
        if (pageNo != null) {
            m.put("pageNo", pageNo);
        }
        if (pageSize != null) {
            m.put("pageSize", pageSize);
        }
        if (siteId != null && !siteId.isEmpty()) {
            m.put("siteId", siteId);
        }
        if (beginDate != null && !beginDate.isEmpty()) {
            m.put("beginDate", beginDate);
        }
        if (endDate != null && !endDate.isEmpty()) {
            m.put("endDate", endDate);
        }
        return m;
    }
}
