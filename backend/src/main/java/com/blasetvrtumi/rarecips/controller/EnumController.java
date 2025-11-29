package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.enums.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/enums")
@CrossOrigin(origins = "https://localhost:4200")
public class EnumController {

    @GetMapping("/difficulty")
    public ResponseEntity<List<Integer>> getDifficultyLevels() {
        List<Integer> levels = Arrays.stream(DifficultyLevel.values())
                .map(DifficultyLevel::getValue)
                .collect(Collectors.toList());
        return ResponseEntity.ok(levels);
    }

    @GetMapping("/cuisine-types")
    public ResponseEntity<List<String>> getCuisineTypes() {
        List<String> types = Arrays.stream(CuisineType.values())
                .map(CuisineType::getDisplayName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }

    @GetMapping("/cautions")
    public ResponseEntity<List<String>> getCautions() {
        List<String> cautions = Arrays.stream(Caution.values())
                .map(Caution::getDisplayName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(cautions);
    }

    @GetMapping("/diet-labels")
    public ResponseEntity<List<String>> getDietLabels() {
        List<String> labels = Arrays.stream(DietLabel.values())
                .map(DietLabel::getDisplayName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(labels);
    }

    @GetMapping("/dish-types")
    public ResponseEntity<List<String>> getDishTypes() {
        List<String> types = Arrays.stream(DishType.values())
                .map(DishType::getDisplayName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }

    @GetMapping("/health-labels")
    public ResponseEntity<List<String>> getHealthLabels() {
        List<String> labels = Arrays.stream(HealthLabel.values())
                .map(HealthLabel::getDisplayName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(labels);
    }

    @GetMapping("/meal-types")
    public ResponseEntity<List<String>> getMealTypes() {
        List<String> types = Arrays.stream(MealType.values())
                .map(MealType::getDisplayName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }
}
