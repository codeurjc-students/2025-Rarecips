package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.security.jwt.JwtTokenProvider;
import com.blasetvrtumi.rarecips.service.UserService;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    @Operation(summary = "Update user info by username")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User info updated successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "403", description = "Forbidden access"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PutMapping("/{username}")
    public ResponseEntity<?> updateUser(
            @PathVariable String username,
            @RequestBody User updatedUser,
            Authentication authentication) {
        // Update user parameters
        User currentUser = userService.findByUsername(username);
        currentUser.setProfileImageFile(updatedUser.getProfileImageFile());
        currentUser.setProfileImageString(updatedUser.getProfileImageString());
        currentUser.setDisplayName(updatedUser.getDisplayName());
        currentUser.setEmail(updatedUser.getEmail());
        currentUser.setBio(updatedUser.getBio());
        System.out.println(currentUser);
        userService.save(currentUser);

        String currentUsername = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!currentUsername.equals(username) && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You are not authorized to update this user's information.");
        }


        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Update own's last online timestamp")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Last online timestamp updated successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "403", description = "Forbidden access")
    })
    @PutMapping("/{username}/checkin")
    public ResponseEntity<Void> updateLastOnline(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(400).build();
        }

        User user = userService.findByUsername(principal.getName());
        user.setLastOnline(java.time.LocalDateTime.now());
        userService.save(user);
        return ResponseEntity.ok().build();
    }
}
