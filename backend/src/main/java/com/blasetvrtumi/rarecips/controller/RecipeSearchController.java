package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recipes/search")
@CrossOrigin(origins = "https://localhost:4200")
public class RecipeSearchController {

    @Autowired
    private RecipeRepository recipeRepository;

    @GetMapping("/by-diet-label")
    public ResponseEntity<List<Recipe>> findByDietLabel(@RequestParam String dietLabel) {
        List<Recipe> recipes = recipeRepository.findByDietLabel(dietLabel);
        return ResponseEntity.ok(recipes);
    }

    @GetMapping("/by-health-label")
    public ResponseEntity<List<Recipe>> findByHealthLabel(@RequestParam String healthLabel) {
        List<Recipe> recipes = recipeRepository.findByHealthLabel(healthLabel);
        return ResponseEntity.ok(recipes);
    }

    @GetMapping("/by-caution")
    public ResponseEntity<List<Recipe>> findByCaution(@RequestParam String caution) {
        List<Recipe> recipes = recipeRepository.findByCaution(caution);
        return ResponseEntity.ok(recipes);
    }

    @GetMapping("/by-cuisine-type")
    public ResponseEntity<List<Recipe>> findByCuisineType(@RequestParam String cuisineType) {
        List<Recipe> recipes = recipeRepository.findByCuisineType(cuisineType);
        return ResponseEntity.ok(recipes);
    }

    @GetMapping("/by-dish-type")
    public ResponseEntity<List<Recipe>> findByDishType(@RequestParam String dishType) {
        List<Recipe> recipes = recipeRepository.findByDishType(dishType);
        return ResponseEntity.ok(recipes);
    }

    @GetMapping("/by-meal-type")
    public ResponseEntity<List<Recipe>> findByMealType(@RequestParam String mealType) {
        List<Recipe> recipes = recipeRepository.findByMealType(mealType);
        return ResponseEntity.ok(recipes);
    }

    @PostMapping("/by-tags")
    public ResponseEntity<Page<Recipe>> findByTags(
            @RequestParam(required = false) List<String> dietLabels,
            @RequestParam(required = false) List<String> healthLabels,
            @RequestParam(required = false) List<String> cautions,
            @RequestParam(required = false) List<String> cuisineTypes,
            @RequestParam(required = false) List<String> dishTypes,
            @RequestParam(required = false) List<String> mealTypes,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Recipe> recipes = recipeRepository.findByTags(
                dietLabels, healthLabels, cautions, cuisineTypes, dishTypes, mealTypes, pageable);
        return ResponseEntity.ok(recipes);
    }
}

