package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    @Operation(summary = "Get recipe by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found the recipe", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = Recipe.class))}),
            @ApiResponse(responseCode = "404", description = "Recipe not found", content = @Content)})
    @GetMapping("/{id}")
    public ResponseEntity<?> getRecipeById(@PathVariable Long id) {
        Recipe recipe = recipeService.findById(id);
        HashMap<String, Object> response = new HashMap<>();
        if (recipe != null) {
            response.put("recipe", recipe);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(404).body("Recipe not found");
        }
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
            return ResponseEntity.status(201).body(response);
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
            return ResponseEntity.ok(response);
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

        Pageable pageable = PageRequest.of(page, size,
            org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "updatedAt"));

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
                    emptyResponse.put("recipes", new java.util.ArrayList<>());
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
            List<Recipe> all = new java.util.ArrayList<>(filtered.getContent());
            all.sort((a, b) -> Integer.compare(
                b.getReviews() != null ? b.getReviews().size() : 0,
                a.getReviews() != null ? a.getReviews().size() : 0
            ));
            int start = page * size;
            int end = Math.min(start + size, all.size());
            List<Recipe> pageContent = start < end ? all.subList(start, end) : new java.util.ArrayList<>();
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
            List<Recipe> all = new java.util.ArrayList<>(filtered.getContent());
            all.sort((a, b) -> Float.compare(b.getRating(), a.getRating()));
            int start = page * size;
            int end = Math.min(start + size, all.size());
            List<Recipe> pageContent = start < end ? all.subList(start, end) : new java.util.ArrayList<>();
            HashMap<String, Object> response = new HashMap<>();
            response.put("recipes", pageContent);
            response.put("total", all.size());
            response.put("page", page);
            response.put("size", size);
            return ResponseEntity.ok(response);
        } else {
            org.springframework.data.domain.Sort sort;
            if ("alphabetical".equals(sortBy)) {
                sort = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "label");
            } else {
                sort = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "updatedAt");
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
}
