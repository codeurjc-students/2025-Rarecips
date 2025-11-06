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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@RequestMapping("/api/v1")
public class LandingController {

    @Autowired
    private RecipeService recipeService;

    @Operation(summary = "Get newest recipes")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Found recipes", content = {
                    @Content(mediaType = "application/json", schema = @Schema(implementation = Recipe.class)) }),
            @ApiResponse(responseCode = "404", description = "No recipes found", content = @Content) })
    @JsonView(Recipe.BasicInfo.class)
    @GetMapping("/recipes")
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