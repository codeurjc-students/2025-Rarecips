package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Notification;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.service.NotificationService;
import com.blasetvrtumi.rarecips.service.UserService;
import com.fasterxml.jackson.annotation.JsonView;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserService userService;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return userService.findByUsername(authentication.getName());
    }

    @Operation(summary = "Get current user notifications")
    @GetMapping
    @JsonView(Notification.BasicInfo.class)
    public ResponseEntity<?> getMyNotifications(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        List<Notification> notifications = notificationService.getUserNotifications(user);
        long unreadCount = notificationService.getUnreadCount(user);

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notifications);
        response.put("unreadCount", unreadCount);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Mark a notification as read")
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        notificationService.markAsRead(id, user);
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }

    @Operation(summary = "Mark all notifications as read")
    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");

        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}
