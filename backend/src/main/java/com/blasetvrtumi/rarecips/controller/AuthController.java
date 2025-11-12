package com.blasetvrtumi.rarecips.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.blasetvrtumi.rarecips.security.jwt.AuthResponse;
import com.blasetvrtumi.rarecips.security.jwt.AuthService;
import com.blasetvrtumi.rarecips.service.UserService;
import com.blasetvrtumi.rarecips.security.jwt.AuthRequest;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.web.bind.annotation.RequestBody;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

        @Autowired
        private AuthService authService;

        @Autowired
        private UserService userService;

    @Operation(summary = "User login endpoint")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            }),
            @ApiResponse(responseCode = "400", description = "Invalid credentials"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access")
    })
    @PutMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @CookieValue(name = "accessToken", required = false) String accessToken,
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            @RequestBody AuthRequest loginRequest) {

        return authService.login(loginRequest, accessToken, refreshToken);
    }

    @Operation(summary = "User registration endpoint")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registration successful", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            }),
            @ApiResponse(responseCode = "400", description = "Invalid registration data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access")
    })
        @PutMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody AuthRequest signupRequest) {

        return authService.signup(signupRequest);
    }

    @Operation(summary = "Refresh token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token refreshed", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            }),
            @ApiResponse(responseCode = "400", description = "Invalid token"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access")
    })
    @PutMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {

        return authService.refresh(refreshToken);
    }

    @Operation(summary = "Index all users' usernames for validation")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usernames retrieved successfully", content = {
                @Content(mediaType = "application/json", schema = @Schema(implementation = String[].class))
        })
    })
    @GetMapping("/usernames")
    public ResponseEntity<String[]> getAllUsernames() {
        String[] usernames =  userService.getAllUsernames();
        return ResponseEntity.ok(usernames);
    }

    @Operation(summary = "Index all users' emails for validation")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Emails retrieved successfully", content = {
                @Content(mediaType = "application/json", schema = @Schema(implementation = String[].class))
        })
    })
    @GetMapping("/emails")
    public ResponseEntity<String[]> getAllEmails() {
        String[] emails = userService.getAllEmails();
        return ResponseEntity.ok(emails);
    }

    @Operation(summary = "Logout")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logout successful", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))
            }),
            @ApiResponse(responseCode = "400", description = "Invalid token"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access")
    })
    @PutMapping("/logout")
    public ResponseEntity<AuthResponse> logOut(HttpServletRequest request, HttpServletResponse response) {

        return ResponseEntity.ok(new AuthResponse(AuthResponse.Status.SUCCESS, authService.logout(request, response)));
    }

}
