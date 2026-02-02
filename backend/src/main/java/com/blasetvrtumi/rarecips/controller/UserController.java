package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Ingredient;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.service.UserService;
import com.blasetvrtumi.rarecips.service.MailService;
import com.fasterxml.jackson.annotation.JsonView;

import java.security.Principal;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MailService mailService;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Operation(summary = "Get current logged-in user info")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User info retrieved successfully", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = User.class))
            }),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
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

    @Operation(summary = "Get user info by username with optional display parameter")
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
    public ResponseEntity<?> getUserByUsername(
            @PathVariable String username,
            @RequestParam(required = false) String display,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        User user = userService.findByUsername(username);
        if (user == null) {
            return ResponseEntity.status(404).build();
        }

        boolean isOwner = false;
        boolean isAdmin = false;
        if (authentication != null && authentication.isAuthenticated()) {
            isOwner = authentication.getName().equals(username);
            User loggedUser = userService.findByUsername(authentication.getName());
            isAdmin = loggedUser.getRole().equals("ADMIN");
        }
        if (user.isPrivateProfile() && !isOwner && !isAdmin) {
            return ResponseEntity.status(403).body("This profile is private.");
        }

        if (display != null) {
            HashMap<String, Object> response = new HashMap<>();
            Pageable pageable = PageRequest.of(page, size);
            switch (display.toLowerCase()) {
                case "recipes":
                    Page<?> recipes = userService.getUserRecipes(username, pageable);
                    response.put("content", recipes.getContent());
                    response.put("total", recipes.getTotalElements());
                    response.put("page", page);
                    response.put("size", size);
                    response.put("hasMore", !recipes.isLast());
                    return ResponseEntity.ok(response);
                case "reviews":
                    Page<?> reviews = userService.getUserReviews(username, pageable);
                    response.put("content", reviews.getContent());
                    response.put("total", reviews.getTotalElements());
                    response.put("page", page);
                    response.put("size", size);
                    response.put("hasMore", !reviews.isLast());
                    return ResponseEntity.ok(response);
                case "collections":
                    Page<?> collections = userService.getUserCollections(username, pageable, authentication);
                    response.put("content", collections.getContent());
                    response.put("total", collections.getTotalElements());
                    response.put("page", page);
                    response.put("size", size);
                    response.put("hasMore", !collections.isLast());
                    return ResponseEntity.ok(response);
                case "ingredients":
                    Page<?> ingredients = userService.getUserIngredientsPage(username, pageable);
                    response.put("content", ingredients.getContent());
                    response.put("total", ingredients.getTotalElements());
                    response.put("page", page);
                    response.put("size", size);
                    response.put("hasMore", !ingredients.isLast());
                    return ResponseEntity.ok(response);
                default:
                    return ResponseEntity.badRequest().body("Invalid display parameter. Use: recipes, reviews, collections, or ingredients");
            }
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
        currentUser.setPrivateProfile(updatedUser.isPrivateProfile());
        List<Ingredient> ingredients = updatedUser.getIngredients();
        Optional.ofNullable(ingredients).ifPresent(currentUser::setIngredients);
        userService.save(currentUser);

        String currentUsername = authentication.getName();
        User user = userService.findByUsername(authentication.getName());
        boolean isAdmin = user.getRole().equals("ADMIN");

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
            @ApiResponse(responseCode = "400", description = "Bad request")
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
            @ApiResponse(responseCode = "400", description = "Bad request")
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
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ingredient deleted successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request")
    })
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
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stored ingredients cleared successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request")
    })
    @PutMapping("/me/ingredients/clear")
    public ResponseEntity<Void> clearStoredIngredients(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) return ResponseEntity.status(400).build();
        User user = userService.findByUsername(principal.getName());
        user.setIngredients(new ArrayList<>());
        userService.save(user);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Search users by query")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request")
    })
    @GetMapping("/search")
    @JsonView(User.BasicInfo.class)
    public ResponseEntity<?> searchUsers(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {

        Pageable pageable = PageRequest.of(page, size,
            org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        Page<User> users = userRepository.findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
            query != null ? query : "",
            query != null ? query : "",
            pageable
        );

        HashMap<String, Object> response = new HashMap<>();
        response.put("users", users.getContent());
        response.put("total", users.getTotalElements());
        response.put("page", page);
        response.put("size", size);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Filter users with multiple criteria")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Users retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request")
    })
    @GetMapping("/filter")
    @JsonView(User.BasicInfo.class)
    public ResponseEntity<?> filterUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Integer minRecipes,
            @RequestParam(required = false) Integer minReviews,
            @RequestParam(required = false) Integer minCollections,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Page<User> users = userService.filterUsers(query, minRecipes, minReviews, minCollections, sortBy, direction, page, size);

        HashMap<String, Object> response = new HashMap<>();
        response.put("users", users.getContent());
        response.put("total", users.getTotalElements());
        response.put("page", page);
        response.put("size", size);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete current user and all associated data (cascade)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User deleted successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteCurrentUser(HttpServletRequest request) {
        Principal principal = request.getUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        String username = principal.getName();
        try {
            userService.deleteUserAndCascade(username);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting user: " + e.getMessage());
        }
    }

    @Operation(summary = "Delete user by username (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User deleted successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request")
    })
    @DeleteMapping("/{username}")
    public ResponseEntity<?> deleteUserByUsername(@PathVariable String username, Authentication authentication) {
        User adminUser = userService.findByUsername(authentication.getName());
        if (!adminUser.getRole().equals("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins are allowed to delete users.");
        }
        try {
            userService.deleteUserAndCascade(username);
            return ResponseEntity.ok().body("User deleted successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting user: " + e.getMessage());
        }
    }

    @Operation(summary = "Change password for current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password changed successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "403", description = "Forbidden access"),
            @ApiResponse(responseCode = "422", description = "Unprocessable entity: current password incorrect")
    })
    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(Authentication authentication, @RequestBody HashMap<String, String> payload) {
        String username = authentication.getName();
        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");
        String confirmPassword = payload.get("confirmPassword");
        User user = userService.findByUsername(username);

        User loggedUser = userService.findByUsername(authentication.getName());
        if (!authentication.getName().equals(user.getUsername()) && !loggedUser.getRole().equals("ADMIN")) {
            return ResponseEntity.status(403).body(Collections.singletonMap("error", "You are not authorized to change this user's password."));
        }
        if (currentPassword == null || newPassword == null || confirmPassword == null) {
            return ResponseEntity.badRequest().body("Missing password fields");
        }
        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body("Password mismatch.");
        }
        if (!userService.validatePassword(newPassword)) {
            return ResponseEntity.badRequest().body("Password requirements not met.");
        }
        boolean valid = userService.checkPassword(username, currentPassword);
        if (!valid) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body("Current password is incorrect.");
        }
        userService.updatePassword(username, newPassword);
        return ResponseEntity.ok().body("Password changed successfully.");
    }

    @Operation(summary = "Change user password by admin")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password changed successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request")
    })
    @PutMapping("/{username}/password")
    public ResponseEntity<?> adminChangeUserPassword(@PathVariable String username, @RequestBody HashMap<String, String> payload, Authentication authentication) {
        User adminUser = userService.findByUsername(authentication.getName());
        if (!adminUser.getRole().equals("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins are allowed to change user passwords.");
        }
        String newPassword = payload.get("newPassword");
        String confirmPassword = payload.get("confirmPassword");
        if (newPassword == null || confirmPassword == null) {
            return ResponseEntity.badRequest().body("Missing password fields");
        }
        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body("Password mismatch.");
        }
        if (!userService.validatePassword(newPassword)) {
            return ResponseEntity.badRequest().body("Password requirements not met.");
        }
        userService.updatePassword(username, newPassword);
        return ResponseEntity.ok().body("Password changed successfully.");
    }

    @Operation(summary = "Change password by email or token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password recovery email sent or password changed successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/change-password")
    public ResponseEntity<?> recoverOrChangePassword(@RequestBody HashMap<String, String> payload, Authentication authentication) {
        String email = payload.get("email");
        String token = payload.get("token");
        String newPassword = payload.get("newPassword");
        String confirmPassword = payload.get("confirmPassword");
        if (email != null) {
            User user = userService.findByEmail(email);
            if (user == null) return ResponseEntity.status(404).body(Collections.singletonMap("error", "No user found with that email."));

            String recoveryToken = UUID.randomUUID().toString();
            user.setPasswordResetToken(recoveryToken);
            user.setPasswordResetTokenExpiry(java.time.LocalDateTime.now().plusHours(2));
            userService.save(user);
            String theme = payload.getOrDefault("theme", "theme-tangerine-light");
            String lang = payload.getOrDefault("lang", "en");
            String username = user.getUsername();
            String passwordChangeLink = frontendUrl + "/change-password?token=" + recoveryToken;
            mailService.sendChangePasswordEmail(
                user.getEmail(),
                recoveryToken,
                frontendUrl,
                lang,
                "theme-" + theme,
                username,
                passwordChangeLink
            );
            return ResponseEntity.ok(Collections.singletonMap("message", "Recovery email sent."));
        } else if (token != null && newPassword != null && confirmPassword != null) {
            User user = userService.findByPasswordResetToken(token);

            if (user == null || user.getPasswordResetTokenExpiry() == null || user.getPasswordResetTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
                return ResponseEntity.status(400).body(Collections.singletonMap("error", "Invalid or expired token."));
            }
            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Password mismatch."));
            }
            if (!userService.validatePassword(newPassword)) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Password requirements not met."));
            }
            userService.updatePassword(user.getUsername(), newPassword);
            user.setPasswordResetToken(null);
            user.setPasswordResetTokenExpiry(null);
            userService.save(user);
            return ResponseEntity.ok(Collections.singletonMap("message", "Password changed successfully"));
        } else {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Missing required fields."));
        }
    }
}
