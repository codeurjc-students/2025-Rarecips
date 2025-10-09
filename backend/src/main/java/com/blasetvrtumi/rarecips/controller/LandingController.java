package com.blasetvrtumi.rarecips.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.List;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.service.RecipeService;
import com.fasterxml.jackson.annotation.JsonView;

@RestController
public class LandingController {

    @Autowired
    private RecipeService recipeService;

    @JsonView(Recipe.BasicInfo.class)
    @GetMapping("/api/recipes")
    public ResponseEntity<?> getNewestRecipes(@RequestParam String order, @RequestParam int size, @RequestParam int page) {
        String sortBy = "";
        if (order.equals("lastmod")) {
            sortBy = "updatedAt";
        }
        Page<Recipe> newestRecipes = recipeService.getRecipes(sortBy, size, page);
        List<Recipe> recipeList = newestRecipes.getContent();

        if (recipeList.size() > 0) {
            HashMap<String, Object> response = new HashMap<>();
            response.put("recipes", recipeList);
            response.put("total", newestRecipes.getTotalElements());
            return ResponseEntity.ok(response);
        } else {
            return new ResponseEntity<>("No recipes found", HttpStatus.NOT_FOUND);
        }
    }

}