package com.blasetvrtumi.rarecips.util;

import com.blasetvrtumi.rarecips.enums.*;

import java.util.List;

public class EnumValidator {

    public static void validateCuisineTypes(List<String> cuisineTypes) {
        if (cuisineTypes == null) return;
        for (String type : cuisineTypes) {
            try {
                CuisineType.fromDisplayName(type);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid cuisine type: " + type);
            }
        }
    }

    public static void validateCautions(List<String> cautions) {
        if (cautions == null) return;
        for (String caution : cautions) {
            try {
                Caution.fromDisplayName(caution);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid caution: " + caution);
            }
        }
    }

    public static void validateDietLabels(List<String> dietLabels) {
        if (dietLabels == null) return;
        for (String label : dietLabels) {
            try {
                DietLabel.fromDisplayName(label);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid diet label: " + label);
            }
        }
    }

    public static void validateDishTypes(List<String> dishTypes) {
        if (dishTypes == null) return;
        for (String type : dishTypes) {
            try {
                DishType.fromDisplayName(type);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid dish type: " + type);
            }
        }
    }

    public static void validateHealthLabels(List<String> healthLabels) {
        if (healthLabels == null) return;
        for (String label : healthLabels) {
            try {
                HealthLabel.fromDisplayName(label);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid health label: " + label);
            }
        }
    }

    public static void validateMealTypes(List<String> mealTypes) {
        if (mealTypes == null) return;
        for (String type : mealTypes) {
            try {
                MealType.fromDisplayName(type);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid meal type: " + type);
            }
        }
    }

    public static void validateDifficulty(int difficulty) {
        try {
            DifficultyLevel.fromValue(difficulty);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid difficulty level: " + difficulty);
        }
    }
}

