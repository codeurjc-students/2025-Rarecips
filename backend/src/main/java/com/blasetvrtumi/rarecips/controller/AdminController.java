package com.blasetvrtumi.rarecips.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.ReviewRepository;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import com.blasetvrtumi.rarecips.repository.IngredientRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

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
            if (mailSender instanceof JavaMailSenderImpl) {
                ((JavaMailSenderImpl) mailSender).testConnection();
            }
        } catch (Exception e) {
            mailStatus = "admin_down";
        }
        status.put("mail", mailStatus);

        status.put("api", "admin_operational");
        status.put("websockets", "admin_down");

        return ResponseEntity.ok(status);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@RequestParam(name = "range", defaultValue = "admin_last_7_days") String range) {
        Map<String, Object> stats = new HashMap<>();

        long totalUsers = userRepository.count();
        long totalRecipes = recipeRepository.count();
        long totalReviews = reviewRepository.count();
        long totalIngredients = ingredientRepository.count();

        stats.put("totalUsers", totalUsers);
        stats.put("totalRecipes", totalRecipes);
        stats.put("totalReviews", totalReviews);
        stats.put("totalIngredients", totalIngredients);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        LocalDateTime prevStart;
        int chartDays;

        switch (range) {
            case "admin_last_30_days":
                start = now.minusDays(30);
                prevStart = now.minusDays(60);
                chartDays = 30;
                break;
            case "admin_this_month":
                start = now.withDayOfMonth(1).toLocalDate().atStartOfDay();
                prevStart = start.minusMonths(1);
                chartDays = now.getDayOfMonth();
                break;
            case "admin_this_year":
                start = now.withDayOfYear(1).toLocalDate().atStartOfDay();
                prevStart = start.minusYears(1);
                chartDays = 12; //srot by month
                break;
            case "admin_all_time":
                start = LocalDateTime.of(2024, 1, 1, 0, 0); 
                prevStart = start;
                chartDays = 30;
                break;
            case "admin_last_7_days":
            default:
                start = now.minusDays(7);
                prevStart = now.minusDays(14);
                chartDays = 7;
                break;
        }

        stats.put("usersGrowth", calculateGrowth(userRepository.countByCreatedAtBetween(start, now), userRepository.countByCreatedAtBetween(prevStart, start)));
        stats.put("recipesGrowth", calculateGrowth(recipeRepository.countByCreatedAtBetween(start, now), recipeRepository.countByCreatedAtBetween(prevStart, start)));
        stats.put("reviewsGrowth", calculateGrowth(reviewRepository.countByCreatedAtBetween(start, now), reviewRepository.countByCreatedAtBetween(prevStart, start)));
        stats.put("ingredientsGrowth", calculateGrowth(ingredientRepository.countByCreatedAtBetween(start, now), ingredientRepository.countByCreatedAtBetween(prevStart, start)));

        List<Map<String, Object>> userGrowthData = new ArrayList<>();
        List<Map<String, Object>> recipeGrowthData = new ArrayList<>();
        List<Map<String, Object>> reviewGrowthData = new ArrayList<>();

        if ("admin_this_year".equals(range)) {
            for (int i = 0; i < 12; i++) {
                LocalDateTime monthStart = now.minusMonths(11 - i).withDayOfMonth(1).toLocalDate().atStartOfDay();
                LocalDateTime monthEnd = monthStart.plusMonths(1);
                String label = monthStart.getMonth().toString().substring(0, 3);
                
                userGrowthData.add(createChartPoint(label, userRepository.countByCreatedAtBetween(monthStart, monthEnd)));
                recipeGrowthData.add(createChartPoint(label, recipeRepository.countByCreatedAtBetween(monthStart, monthEnd)));
                reviewGrowthData.add(createChartPoint(label, reviewRepository.countByCreatedAtBetween(monthStart, monthEnd)));
            }
        } else {
            for (int i = chartDays - 1; i >= 0; i--) {
                LocalDateTime dStart = now.minusDays(i).toLocalDate().atStartOfDay();
                LocalDateTime dEnd = dStart.plusDays(1);
                String label = dStart.getDayOfMonth() + "/" + dStart.getMonthValue();

                userGrowthData.add(createChartPoint(label, userRepository.countByCreatedAtBetween(dStart, dEnd)));
                recipeGrowthData.add(createChartPoint(label, recipeRepository.countByCreatedAtBetween(dStart, dEnd)));
                reviewGrowthData.add(createChartPoint(label, reviewRepository.countByCreatedAtBetween(dStart, dEnd)));
            }
        }

        stats.put("userGrowthChart", userGrowthData);
        stats.put("recipeGrowthChart", recipeGrowthData);
        stats.put("reviewGrowthChart", reviewGrowthData);

        return ResponseEntity.ok(stats);
    }

    private Map<String, Object> createChartPoint(String label, long count) {
        Map<String, Object> point = new HashMap<>();
        point.put("date", label);
        point.put("count", count);
        return point;
    }

    private double calculateGrowth(long current, long previous) {
        if (previous == 0) return current > 0 ? 100 : 0;
        return Math.round(((double)(current - previous) / previous * 100) * 10.0) / 10.0;
    }
}
