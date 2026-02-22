package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.enums.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/enums")
@CrossOrigin(origins = "https://localhost:4200")
public class EnumController {

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

    @Operation(summary = "Get all cautions")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved cuisine types"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/cuisine-types")
    public ResponseEntity<List<String>> getCuisineTypes() {
        List<String> types = Arrays.stream(CuisineType.values())
                .map(CuisineType::getDisplayName)
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
        List<String> cautions = Arrays.stream(Caution.values())
                .map(Caution::getDisplayName)
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
        List<String> labels = Arrays.stream(DietLabel.values())
                .map(DietLabel::getDisplayName)
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
        List<String> types = Arrays.stream(DishType.values())
                .map(DishType::getDisplayName)
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
        List<String> labels = Arrays.stream(HealthLabel.values())
                .map(HealthLabel::getDisplayName)
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
        List<String> types = Arrays.stream(MealType.values())
                .map(MealType::getDisplayName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }
}
