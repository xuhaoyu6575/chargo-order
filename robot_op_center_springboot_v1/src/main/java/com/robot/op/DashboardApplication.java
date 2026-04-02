package com.robot.op;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@Slf4j
@SpringBootApplication
public class DashboardApplication {

    public static void main(String[] args) {
        SpringApplication.run(DashboardApplication.class, args);
        log.info("运营中心 Dashboard 已启动（Dashboard: cloud.api.mock；营收: revenue.api.mock）");
    }
}
