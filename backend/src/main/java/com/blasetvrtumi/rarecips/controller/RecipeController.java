package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Activity;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.service.ActivityService;
import com.blasetvrtumi.rarecips.service.ImageService;
import com.blasetvrtumi.rarecips.service.RecipeService;

import com.blasetvrtumi.rarecips.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.blasetvrtumi.rarecips.enums.RecipeStatus;
import java.net.URI;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/recipes")
public class RecipeController {

    @Autowired
    private RecipeService recipeService;
    @Autowired
    private ImageService imageService;
    @Autowired
    private RecipeRepository recipeRepository;
    @Autowired
    private UserService userService;
    @Autowired
    private ActivityService activityService;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return userService.findByUsername(authentication.getName());
    }

    private boolean canViewPendingRecipe(Recipe recipe, User user) {
        if (!recipe.isPendingReview()) {
            return true;
        }
        if (user == null) {
            return false;
        }
        if ("ADMIN".equals(user.getRole())) {
            return true;
        }
        return recipe.getAuthor() != null && recipe.getAuthor().equals(user.getUsername());
    }

    @Operation(summary = "Get recipe by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the recipe", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = Recipe.class))}),
            @ApiResponse(responseCode = "404", description = "Recipe not found", content = @Content)})
    @GetMapping("/{id}")
    public ResponseEntity<?> getRecipeById(@PathVariable Long id, Authentication authentication) {
        Recipe recipe = recipeService.findById(id);
        if (recipe == null) return ResponseEntity.status(404).body("Recipe not found");

        User authenticatedUser = getAuthenticatedUser(authentication);
        if (!canViewPendingRecipe(recipe, authenticatedUser)) {
            return ResponseEntity.status(403).body("Recipe is pending approvak");
        }
        
        HashMap<String, Object> response = new HashMap<>();
        response.put("recipe", recipe);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Create a new recipe")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Recipe created successfully", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = Recipe.class))}),
            @ApiResponse(responseCode = "400", description = "Invalid input", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)})
    @PutMapping
    public ResponseEntity<?> createRecipe(@RequestBody Map<String, Object> recipeData, Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("User must be authenticated");
            } else if (!recipeData.containsKey("label") || recipeData.get("label").toString().isEmpty()) {
                return ResponseEntity.status(400).body("Recipe label is required");
            }

            String username = authentication.getName();
            User user = this.userService.findByUsername(username);
            if (user.getRole().equals("ADMIN") && recipeData.get("username") != null) username = recipeData.get("username").toString();
            Recipe recipe = recipeService.createRecipeFromMap(recipeData, username);

            if (Objects.equals(recipe.getImageString(), "")) {
                String defaultRecipeImage = imageService.localImageToString("static/assets/img/recipe.png");
                recipe.setImageString(defaultRecipeImage);
                recipe = recipeService.updateRecipe(recipe.getId(), recipe, username);
            }

            HashMap<String, Object> response = new HashMap<>();
            response.put("recipe", recipe);

            URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath()
                .path("/api/v1/recipes/{id}")
                .buildAndExpand(recipe.getId())
                .toUri();

            return ResponseEntity.status(201).header("Location", location.toString()).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body("Error creating recipe: " + e.getMessage());
        }
    }

    @Operation(summary = "Update an existing recipe")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recipe updated successfully", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = Recipe.class))}),
            @ApiResponse(responseCode = "404", description = "Recipe not found", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not the recipe author", content = @Content)})
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRecipe(@PathVariable Long id, @RequestBody Map<String, Object> recipeData, Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("User must be authenticated");
            }

            if (!recipeData.containsKey("label") || recipeData.get("label").toString().isEmpty()) {
                return ResponseEntity.status(400).body("Recipe label is required");
            }

            String username = authentication.getName();
            User user = this.userService.findByUsername(username);
            if (user.getRole().equals("ADMIN") && recipeData.get("username") != null) username = recipeData.get("username").toString();
            Recipe updatedRecipe = recipeService.updateRecipeFromMap(id, recipeData, username);
            HashMap<String, Object> response = new HashMap<>();
            response.put("recipe", updatedRecipe);

            URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath()
                .path("/api/v1/recipes/{id}")
                .buildAndExpand(updatedRecipe.getId())
                .toUri();

            return ResponseEntity.ok().header("Location", location.toString()).body(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body("Error updating recipe: " + e.getMessage());
        }
    }

    @Operation(summary = "Delete a recipe")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recipe deleted successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not the recipe author", content = @Content),
            @ApiResponse(responseCode = "404", description = "Recipe not found", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRecipe(@PathVariable Long id, Authentication authentication) {
        try {
            User user = this.userService.findByUsername(authentication.getName());
            Recipe recipe = this.recipeService.findById(id);
            if (!authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "User must be authenticated"));
            }
            String username = authentication.getName();
            if (username.equals(recipe.getAuthor()) || user.getRole().equals("ADMIN")) {
                recipeService.deleteRecipe(id, username);
                return ResponseEntity.ok(Map.of("message", "Recipe deleted successfully"));
            }
            throw new SecurityException("User is not the author of the recipe");
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }


    @Operation(summary = "Search recipes by query text")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recipes retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "No recipes found", content = @Content)
    })
    @GetMapping("/search")
    public ResponseEntity<?> searchRecipes(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Direction.DESC, "updatedAt"));

        Page<Recipe> recipes = recipeRepository.findRecipesWithFilters(
            query, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, pageable);

        HashMap<String, Object> response = new HashMap<>();
        response.put("recipes", recipes.getContent());
        response.put("total", recipes.getTotalElements());
        response.put("page", page);
        response.put("size", size);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Count recipes by meal type or dish type")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Count retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid parameters", content = @Content),
            @ApiResponse(responseCode = "404", description = "No recipes found", content = @Content)
    })
    @GetMapping("/search/count")
    public ResponseEntity<?> countRecipes(
            @RequestParam(required = false) String mealType,
            @RequestParam(required = false) String dishType) {

        long count;
        HashMap<String, Object> response = new HashMap<>();

        if (mealType != null) {
            count = recipeRepository.countByMealType(mealType);
            response.put("mealType", mealType);
        } else if (dishType != null) {
            count = recipeRepository.countByDishType(dishType);
            response.put("dishType", dishType);
        } else {
            count = recipeRepository.count();
        }

        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Filter recipes with multiple criteria")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recipes retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid parameters", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized - User must be authenticated for certain filters", content = @Content),
            @ApiResponse(responseCode = "404", description = "No recipes found", content = @Content)
    })
    @GetMapping("/filter")
    public ResponseEntity<?> filterRecipes(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) List<String> cuisines,
            @RequestParam(required = false) List<String> mealTypes,
            @RequestParam(required = false) List<String> dishTypes,
            @RequestParam(required = false) List<String> dietLabels,
            @RequestParam(required = false) List<String> healthLabels,
            @RequestParam(required = false) List<Integer> difficulties,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) Integer minTime,
            @RequestParam(required = false) Integer maxTime,
            @RequestParam(required = false) Double minCalories,
            @RequestParam(required = false) Double maxCalories,
            @RequestParam(required = false) Double minWeight,
            @RequestParam(required = false) Double maxWeight,
            @RequestParam(required = false) Integer minPeople,
            @RequestParam(required = false) Integer maxPeople,
            @RequestParam(required = false) Boolean onlyUserIngredients,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            Authentication authentication) {

        List<Long> userIngredientIds = null;
        if (Boolean.TRUE.equals(onlyUserIngredients)) {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("User must be authenticated to use this filter");
            }
            try {
                userIngredientIds = recipeService.getUserIngredientIds(authentication);
                if (userIngredientIds.isEmpty()) {
                    HashMap<String, Object> emptyResponse = new HashMap<>();
                    emptyResponse.put("recipes", new ArrayList<>());
                    emptyResponse.put("total", 0);
                    emptyResponse.put("page", page);
                    emptyResponse.put("size", size);
                    return ResponseEntity.ok(emptyResponse);
                }
            } catch (Exception e) {
                return ResponseEntity.status(400).body("Error getting user ingredients: " + e.getMessage());
            }
        }

        if ("mostPopular".equals(sortBy)) {
            Page<Recipe> filtered = recipeRepository.findRecipesWithFilters(
                query, difficulties, minPeople, maxPeople, minTime, maxTime, minCalories, maxCalories, minWeight, maxWeight, minRating,
                dietLabels, healthLabels, cuisines, dishTypes, mealTypes, userIngredientIds, Pageable.unpaged()
            );
            List<Recipe> all = new ArrayList<>(filtered.getContent());
            all.sort((a, b) -> Integer.compare(
                b.getReviews() != null ? b.getReviews().size() : 0,
                a.getReviews() != null ? a.getReviews().size() : 0
            ));
            int start = page * size;
            int end = Math.min(start + size, all.size());
            List<Recipe> pageContent = start < end ? all.subList(start, end) : new ArrayList<>();
            HashMap<String, Object> response = new HashMap<>();
            response.put("recipes", pageContent);
            response.put("total", all.size());
            response.put("page", page);
            response.put("size", size);
            return ResponseEntity.ok(response);
        } else if ("highestRated".equals(sortBy)) {
            Page<Recipe> filtered = recipeRepository.findRecipesWithFilters(
                query, difficulties, minPeople, maxPeople, minTime, maxTime, minCalories, maxCalories, minWeight, maxWeight, minRating,
                dietLabels, healthLabels, cuisines, dishTypes, mealTypes, userIngredientIds, Pageable.unpaged()
            );
            List<Recipe> all = new ArrayList<>(filtered.getContent());
            all.sort((a, b) -> Float.compare(b.getRating(), a.getRating()));
            int start = page * size;
            int end = Math.min(start + size, all.size());
            List<Recipe> pageContent = start < end ? all.subList(start, end) : new ArrayList<>();
            HashMap<String, Object> response = new HashMap<>();
            response.put("recipes", pageContent);
            response.put("total", all.size());
            response.put("page", page);
            response.put("size", size);
            return ResponseEntity.ok(response);
        } else {
            Sort sort;
            if ("alphabetical".equals(sortBy)) {
                sort = Sort.by(Direction.ASC, "label");
            } else {
                sort = Sort.by(Direction.DESC, "updatedAt");
            }
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<Recipe> recipes = recipeRepository.findRecipesWithFilters(
                query, difficulties, minPeople, maxPeople, minTime, maxTime, minCalories, maxCalories, minWeight, maxWeight, minRating,
                dietLabels, healthLabels, cuisines, dishTypes, mealTypes, userIngredientIds, pageable
            );
            HashMap<String, Object> response = new HashMap<>();
            response.put("recipes", recipes.getContent());
            response.put("total", recipes.getTotalElements());
            response.put("page", page);
            response.put("size", size);
            return ResponseEntity.ok(response);
        }
    }

    @Operation(summary = "Get pending recipes (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pending recipes retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only")
    })
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRecipes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        User adminUser = getAuthenticatedUser(authentication);
        if (adminUser == null) return ResponseEntity.status(401).body("User must be authenticated");
        if (!adminUser.getRole().equals("ADMIN")) {
            return ResponseEntity.status(403).body("Only admins can fetch pending recipes.");
        }
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Direction.DESC, "createdAt"));
        Page<Recipe> pending = recipeRepository.findByPendingReviewTrue(pageable);
        
        HashMap<String, Object> response = new HashMap<>();
        response.put("recipes", pending.getContent());
        response.put("total", pending.getTotalElements());
        response.put("page", page);
        response.put("size", size);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Change status of a pending recipe (approve or reject)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recipe status changed successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin only"),
            @ApiResponse(responseCode = "404", description = "Recipe not found")
    })
    @PutMapping("/{id}/status")
    public ResponseEntity<?> changeRecipeStatus(@PathVariable Long id, @RequestParam String action, Authentication authentication) {
        User adminUser = getAuthenticatedUser(authentication);
        if (adminUser == null) return ResponseEntity.status(401).body("User must be authenticated");

        if (!adminUser.getRole().equals("ADMIN")) {
            return ResponseEntity.status(403).body("Only admins can change recipe status.");
        }

        if (!action.equalsIgnoreCase("approve") && !action.equalsIgnoreCase("reject")) {
            return ResponseEntity.badRequest().body("Invalid action. Use 'approve' or 'reject'.");
        }

        Recipe recipe = recipeService.findById(id);

        if (recipe == null) return ResponseEntity.status(404).body("Recipe not found.");

        if (action.equalsIgnoreCase("approve")) {
            recipe.setStatus(RecipeStatus.APPROVED);
            recipe.setPendingReview(false);
            recipeRepository.save(recipe);
            String authorUsername = recipe.getAuthor();
            if (authorUsername != null) {
                activityService.logActivity(
                        authorUsername,
                        Activity.ActivityType.CREATE_RECIPE,
                        recipe.getLabel(),
                        "created recipe " + recipe.getLabel(),
                        recipe.getId(),
                        null
                );
            }
            // TODO: send notification to user about acceptance
            return ResponseEntity.ok().body(Collections.singletonMap("message", "Recipe approved successfully."));
        } else {
            recipeService.deleteRecipe(id, adminUser.getUsername());
            // TODO: send notification to user about rejection
            return ResponseEntity.ok().body(Collections.singletonMap("message", "Recipe rejected successfully."));
        }
    }

    @Operation(summary = "Report a recipe")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recipe reported successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Recipe not found")
    })
    @PutMapping("/{id}/report")
    public ResponseEntity<?> reportRecipe(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("User must be authenticated to report a recipe");
        }
        Recipe recipe = recipeService.findById(id);
        if (recipe == null) return ResponseEntity.status(404).body("Recipe not found");
        
        recipe.setReported(true);
        recipeRepository.save(recipe);
        return ResponseEntity.ok(Map.of("message", "Recipe reported successfully"));
    }

    @Operation(summary = "Get reported recipes (admin only)")
    @GetMapping("/reported")
    public ResponseEntity<?> getReportedRecipes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        User adminUser = getAuthenticatedUser(authentication);
        if (adminUser == null || !"ADMIN".equals(adminUser.getRole())) {
            return ResponseEntity.status(403).body("Only admins can fetch reported recipes");
        }
        Pageable pageable = PageRequest.of(page, size);
        Page<Recipe> reported = recipeRepository.findByReportedTrue(pageable);
        
        HashMap<String, Object> response = new HashMap<>();
        response.put("recipes", reported.getContent());
        response.put("total", reported.getTotalElements());
        response.put("page", page);
        response.put("size", size);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Dismiss report for a recipe (admin only)")
    @PutMapping("/{id}/dismiss-report")
    public ResponseEntity<?> dismissReport(@PathVariable Long id, Authentication authentication) {
        User adminUser = getAuthenticatedUser(authentication);
        if (adminUser == null || !"ADMIN".equals(adminUser.getRole())) {
            return ResponseEntity.status(403).body("Only admins can dismiss reports");
        }
        Recipe recipe = recipeService.findById(id);
        if (recipe == null) return ResponseEntity.status(404).body("Recipe not found");

        recipe.setReported(false);
        recipeRepository.save(recipe);
        return ResponseEntity.ok(Map.of("message", "Report dismissed successfully"));
    }
}
