package com.robot.op.client.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueTrendPoint {
    private String dateLabel;
    private double revenue;
}
