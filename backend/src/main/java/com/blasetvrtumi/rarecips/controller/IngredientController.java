package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Ingredient;
import com.blasetvrtumi.rarecips.repository.IngredientRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/ingredients")
public class IngredientController {

    @Autowired
    private IngredientRepository ingredientRepository;

    @Operation(summary = "Get all unique ingredient names")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "List of ingredient names retrieved successfully")
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

    @Operation(summary = "Get paged ingredients")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "OK")
    })
    @GetMapping
    public Page<Ingredient> getIngredients(Pageable pageable) {
        return ingredientRepository.findAll(pageable);
    }
}


