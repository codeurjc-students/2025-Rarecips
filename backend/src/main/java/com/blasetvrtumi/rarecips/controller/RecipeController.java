package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.service.RecipeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class RecipeController {
    
    @Autowired
    private RecipeService recipeService;

    @GetMapping("/api/recipes/{id}")
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
