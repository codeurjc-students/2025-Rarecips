package com.blasetvrtumi.rarecips;

import org.slf4j.Logger;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RarecipsApplication {
    private static Logger logger = org.slf4j.LoggerFactory.getLogger(RarecipsApplication.class);
    public static void main(String[] args) {
        SpringApplication.run(RarecipsApplication.class, args);
        logger.info("Rarecips application started successfully.");
    }
}