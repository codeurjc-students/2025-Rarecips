package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.HealthReport;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.service.HealthReportService;
import com.blasetvrtumi.rarecips.service.UserService;
import com.fasterxml.jackson.annotation.JsonView;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/health-reports")
public class HealthReportController {

    @Autowired
    private HealthReportService healthReportService;
    
    @Autowired
    private UserService userService;

    @GetMapping
    @JsonView(HealthReport.BasicInfo.class)
    public ResponseEntity<List<HealthReport>> getUserReports(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userService.findByUsername(principal.getName());
        if (user == null) return ResponseEntity.notFound().build();
        
        List<HealthReport> reports = healthReportService.getUserReports(user);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/summary")
    @JsonView(HealthReport.BasicInfo.class)
    public ResponseEntity<HealthReport> getSummary(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userService.findByUsername(principal.getName());
        if (user == null) return ResponseEntity.notFound().build();

        HealthReport summary = healthReportService.computeAggregates(user);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/generate")
    @JsonView(HealthReport.BasicInfo.class)
    public ResponseEntity<?> generateReport(HttpServletRequest request, @RequestParam(defaultValue = "es") String lang) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userService.findByUsername(principal.getName());
        if (user == null) return ResponseEntity.notFound().build();
        
        try {
            HealthReport report = healthReportService.generateReport(user, lang);
            return ResponseEntity.ok(report);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS)
                                 .body(java.util.Map.of("errorCode", e.getMessage()));
        }
    }
}
