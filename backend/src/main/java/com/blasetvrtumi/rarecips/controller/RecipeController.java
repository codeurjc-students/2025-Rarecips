package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.service.RecipeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/recipes")
public class RecipeController {

    @Autowired
    private RecipeService recipeService;

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
}
