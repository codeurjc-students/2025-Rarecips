package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.RecipeAttribute;
import com.blasetvrtumi.rarecips.enums.*;
import com.blasetvrtumi.rarecips.service.RecipeAttributeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/enums")
@CrossOrigin(origins = "https://localhost:4200")
public class EnumController {

    @Autowired
    private RecipeAttributeService attributeService;

    @Operation(summary = "Get all difficulty levels")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved difficulty levels"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/difficulty")
    public ResponseEntity<List<Integer>> getDifficultyLevels() {
        List<Integer> levels = Arrays.stream(DifficultyLevel.values())
                .map(DifficultyLevel::getValue)
                .collect(Collectors.toList());
        return ResponseEntity.ok(levels);
    }

    @Operation(summary = "Get all cuisine types")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved cuisine types"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/cuisine-types")
    public ResponseEntity<List<String>> getCuisineTypes() {
        List<String> types = attributeService.getByType("cuisineType").stream()
                .map(RecipeAttribute::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }

    @Operation(summary = "Get all cautions")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved cautions"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/cautions")
    public ResponseEntity<List<String>> getCautions() {
        List<String> cautions = attributeService.getByType("caution").stream()
                .map(RecipeAttribute::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(cautions);
    }

    @Operation(summary = "Get all diet labels")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved diet labels"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/diet-labels")
    public ResponseEntity<List<String>> getDietLabels() {
        List<String> labels = attributeService.getByType("dietLabel").stream()
                .map(RecipeAttribute::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(labels);
    }

    @Operation(summary = "Get all dish types")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved dish types"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/dish-types")
    public ResponseEntity<List<String>> getDishTypes() {
        List<String> types = attributeService.getByType("dishType").stream()
                .map(RecipeAttribute::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }

    @Operation(summary = "Get all health labels")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved health labels"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/health-labels")
    public ResponseEntity<List<String>> getHealthLabels() {
        List<String> labels = attributeService.getByType("healthLabel").stream()
                .map(RecipeAttribute::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(labels);
    }

    @Operation(summary = "Get all meal types")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved meal types"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/meal-types")
    public ResponseEntity<List<String>> getMealTypes() {
        List<String> types = attributeService.getByType("mealType").stream()
                .map(RecipeAttribute::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/attributes")
    public ResponseEntity<List<RecipeAttribute>> getAllAttributes() {
        return ResponseEntity.ok(attributeService.getAll());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/attributes")
    public ResponseEntity<RecipeAttribute> addAttribute(@RequestBody RecipeAttribute attribute) {
        return ResponseEntity.ok(attributeService.save(attribute));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/attributes/{id}")
    public ResponseEntity<RecipeAttribute> updateAttribute(@PathVariable Long id, @RequestBody RecipeAttribute attribute) {
        return attributeService.getById(id).map(existing -> {
            existing.setName(attribute.getName());
            existing.setType(attribute.getType());
            return ResponseEntity.ok(attributeService.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/attributes/{id}")
    public ResponseEntity<Void> deleteAttribute(@PathVariable Long id) {
        attributeService.delete(id);
        return ResponseEntity.ok().build();
    }
}

