package com.blasetvrtumi.rarecips.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class SystemStatusController {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/system-status")
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();

        status.put("server", "admin_operational");
        
        String dbStatus = "admin_operational";
        try (Connection connection = dataSource.getConnection()) {
            if (!connection.isValid(1000)) dbStatus = "admin_down";
        } catch (Exception e) {
            dbStatus = "admin_down";
        }
        status.put("database", dbStatus);

        String mailStatus = "admin_operational";
        try {
            if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl) {
                ((org.springframework.mail.javamail.JavaMailSenderImpl) mailSender).testConnection();
            }
        } catch (Exception e) {
            mailStatus = "admin_down";
        }
        status.put("mail", mailStatus);

        status.put("api", "admin_operational");
        status.put("websockets", "admin_down");

        return ResponseEntity.ok(status);
    }
}
