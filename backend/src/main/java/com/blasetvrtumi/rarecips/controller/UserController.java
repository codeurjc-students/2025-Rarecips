package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Ingredient;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.security.jwt.JwtTokenProvider;
import com.blasetvrtumi.rarecips.service.UserService;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
        List<Ingredient> ingredients = updatedUser.getIngredients();
        System.out.println("Updating ingredients: " + updatedUser);
        Optional.ofNullable(ingredients).ifPresent(currentUser::setIngredients);
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

    @Operation(summary = "Add an ingredient to your stored ingredients")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ingredient added successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "403", description = "Forbidden access")
    })
    @PutMapping("/me/ingredients")
    public ResponseEntity<Void> addStoredIngredient(HttpServletRequest request, @RequestBody Ingredient ingredient) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(400).build();
        }

        User user = userService.findByUsername(principal.getName());
        user.addIngredient(ingredient);
        userService.save(user);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Get your stored ingredients")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stored ingredients retrieved successfully", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = Ingredient.class))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "403", description = "Forbidden access")
    })
    @GetMapping("/me/ingredients")
    public ResponseEntity<List<Ingredient>> getStoredIngredients(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(400).build();
        }

        User user = userService.findByUsername(principal.getName());
        List<Ingredient> ingredients = user.getIngredients();
        return ResponseEntity.ok(ingredients);
    }

    @Operation(summary = "Delete a user stored ingredient by ID")
    @PutMapping("/me/ingredients/remove")
    public ResponseEntity<Void> deleteStoredIngredient(HttpServletRequest request, @RequestBody Long ingredientId) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(400).build();
        }

        User user = userService.findByUsername(principal.getName());
        List<Ingredient> ingredients = user.getIngredients();
        ingredients.removeIf(ingredient -> ingredient.getId().equals(ingredientId));
        user.setIngredients(ingredients);
        userService.save(user);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Clear user's ingredient pantry")
    @PutMapping("/me/ingredients/clear")
    public ResponseEntity<Void> clearStoredIngredients(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) return ResponseEntity.status(400).build();
        User user = userService.findByUsername(principal.getName());
        user.setIngredients(new ArrayList<>());
        userService.save(user);
        return ResponseEntity.ok().build();
    }
}
