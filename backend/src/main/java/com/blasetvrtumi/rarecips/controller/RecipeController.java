package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.service.ImageService;
import com.blasetvrtumi.rarecips.service.RecipeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.sql.Blob;
import java.util.HashMap;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/recipes")
public class RecipeController {

    @Autowired
    private RecipeService recipeService;
    @Autowired
    private ImageService imageService;

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
    public ResponseEntity<?> createRecipe(@RequestBody Recipe createdRecipe, Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("User must be authenticated");
            } else if (createdRecipe.getLabel() == null || createdRecipe.getLabel().isEmpty()) {
                return ResponseEntity.status(400).body("Recipe label is required");
            }

            if (Objects.equals(createdRecipe.getImageString(), "")) {
                String defaultRecipeImage = imageService.localImageToString("static/assets/img/recipe.png");
                createdRecipe.setImageString(defaultRecipeImage);
            }

            String username = authentication.getName();
            Recipe recipe = recipeService.createRecipe(createdRecipe, username);
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
    public ResponseEntity<?> updateRecipe(@PathVariable Long id, @RequestBody Recipe recipe, Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("User must be authenticated");
            }

            if (recipe.getLabel() == null || recipe.getLabel().isEmpty()) {
                return ResponseEntity.status(400).body("Recipe label is required");
            }

            String username = authentication.getName();
            Recipe updatedRecipe = recipeService.updateRecipe(id, recipe, username);
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
            @ApiResponse(responseCode = "404", description = "Recipe not found", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not the recipe author", content = @Content)})
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRecipe(@PathVariable Long id, Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("User must be authenticated");
            }
            String username = authentication.getName();
            recipeService.deleteRecipe(id, username);
            return ResponseEntity.ok("Recipe deleted successfully");
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}
