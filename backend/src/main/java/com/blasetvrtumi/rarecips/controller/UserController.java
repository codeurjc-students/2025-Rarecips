package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.security.jwt.JwtTokenProvider;
import com.blasetvrtumi.rarecips.service.UserService;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.media.Content;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "Get current logged-in user info")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User info retrieved successfully", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "403", description = "Forbidden access")
    })
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) {
            return ResponseEntity.noContent().build();
        }

        User user = userService.findByUsername(principal.getName());
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Update own's last online timestamp")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Last online timestamp updated successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "403", description = "Forbidden access")
    })
    @PutMapping("/me/last-online")
    public ResponseEntity<Void> updateLastOnline(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(400).build();
        }

        User user = userService.findByUsername(principal.getName());
        user.setLastOnline(java.time.LocalDateTime.now());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Get user info by username")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User info retrieved successfully", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "403", description = "Forbidden access"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        User user = userService.findByUsername(username);
        if (user == null) {
            return ResponseEntity.status(404).build();
        }
        return ResponseEntity.ok(user);
    }

}
