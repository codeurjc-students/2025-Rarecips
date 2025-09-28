package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.service.RecipeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class RecipeController {

    @Autowired
    private RecipeService recipeService;

    @GetMapping("/api/recipes/{id}")
    public ResponseEntity<?> getRecipeById(@PathVariable Long id) {
        return ResponseEntity.ok(recipeService.findById(id));
    }
}
