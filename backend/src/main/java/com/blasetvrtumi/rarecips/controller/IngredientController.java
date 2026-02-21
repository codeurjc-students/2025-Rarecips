package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Ingredient;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.repository.IngredientRepository;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/ingredients")
public class IngredientController {

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private RecipeRepository recipeRepository;

    @Operation(summary = "Get all unique ingredient names")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "List of ingredient names retrieved successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/names")
    public ResponseEntity<List<String>> getAllIngredientNames() {
        List<String> ingredientNames = ingredientRepository.findAll()
                .stream()
                .map(Ingredient::getFood)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        return ResponseEntity.ok(ingredientNames);
    }

    @Operation(summary = "Get paged ingredients (ordered by id desc)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OK"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping
    public Page<Ingredient> getIngredients(Pageable pageable) {
        return ingredientRepository.findAllByOrderByIdDesc(pageable);
    }

    @Operation(summary = "Search ingredients by name (food)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OK"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/search")
    public Page<Ingredient> searchIngredients(@RequestParam String query, Pageable pageable) {
        return ingredientRepository.searchByFood(query, pageable);
    }

    @Operation(summary = "Delete an ingredient by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ingredient deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Ingredient not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIngredient(@PathVariable Long id, Authentication authentication) {
        if (!userService.getUserByUsername(authentication.getName()).getRole().equals("ADMIN")) {
            return ResponseEntity.status(403).build();
        }

        if (ingredientRepository.existsById(id)) {
            List<Recipe> recipesWithIngredient = recipeRepository.findAll();
            for (Recipe recipe : recipesWithIngredient) {
                if (recipe.getIngredients().removeIf(ingredient -> ingredient.getId().equals(id))) {
                    recipe.getIngredientQuantities().remove(id);
                    recipe.getIngredientUnits().remove(id);
                    recipeRepository.save(recipe);
                }
            }
            ingredientRepository.deleteUserIngredientsByIngredientId(id);
            ingredientRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Create a new ingredient (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Ingredient created successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PutMapping
    public ResponseEntity<Ingredient> createIngredient(@RequestBody Ingredient ingredient, Authentication authentication) {
        if (!userService.getUserByUsername(authentication.getName()).getRole().equals("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        Ingredient saved = ingredientRepository.save(ingredient);

        URI location = ServletUriComponentsBuilder
            .fromCurrentContextPath()
            .path("/api/v1/ingredients/{id}")
            .buildAndExpand(saved.getId())
            .toUri();

        return ResponseEntity.status(201).header("Location", location.toString()).body(saved);
    }

    @Operation(summary = "Update an existing ingredient (admin only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ingredient updated successfully"),
            @ApiResponse(responseCode = "404", description = "Ingredient not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<Ingredient> updateIngredient(@PathVariable Long id, @RequestBody Ingredient ingredientDetails, Authentication authentication) {
        if (!userService.getUserByUsername(authentication.getName()).getRole().equals("ADMIN")) {
            return ResponseEntity.status(403).build();
        }

        return ingredientRepository.findById(id)
                .map(ingredient -> {
                    ingredient.setFood(ingredientDetails.getFood());
                    ingredient.setImageString(ingredientDetails.getImageString());
                    Ingredient updatedIngredient = ingredientRepository.save(ingredient);

                    URI location = ServletUriComponentsBuilder
                        .fromCurrentContextPath()
                        .path("/api/v1/ingredients/{id}")
                        .buildAndExpand(updatedIngredient.getId())
                        .toUri();

                    return ResponseEntity.ok().header("Location", location.toString()).body(updatedIngredient);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(summary = "Get ingredient by ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Ingredient found"),
        @ApiResponse(responseCode = "404", description = "Ingredient not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Ingredient> getIngredientById(@PathVariable Long id) {
        return ingredientRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
