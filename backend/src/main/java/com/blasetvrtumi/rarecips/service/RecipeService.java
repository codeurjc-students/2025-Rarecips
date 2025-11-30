package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.Ingredient;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.IngredientRepository;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.util.EnumValidator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RecipeService {

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    public Recipe findById(Long id) {
        return recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));
    }

    public List<Recipe> getRecipes(Pageable pageable) {
        return recipeRepository.findAll(pageable).getContent();
    }

    public Page<Recipe> getRecipes(String sortBy, int size, int page) {
        Sort sort = Sort.by(Sort.Direction.DESC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Recipe> recipes = recipeRepository.findAll(pageable);
        return recipes;
    }

    public Recipe createRecipe(Recipe recipe, String username) {
        User author = userRepository.findByUsername(username);
        recipe.setAuthor(author);

        EnumValidator.validateDifficulty(recipe.getDifficulty());
        if (recipe.getCuisineType() != null) EnumValidator.validateCuisineTypes(recipe.getCuisineType());
        if (recipe.getCautions() != null) EnumValidator.validateCautions(recipe.getCautions());
        if (recipe.getDietLabels() != null) EnumValidator.validateDietLabels(recipe.getDietLabels());
        if (recipe.getDishTypes() != null) EnumValidator.validateDishTypes(recipe.getDishTypes());
        if (recipe.getMealTypes() != null) EnumValidator.validateMealTypes(recipe.getMealTypes());
        if (recipe.getHealthLabels() != null) EnumValidator.validateHealthLabels(recipe.getHealthLabels());

        if (recipe.getIngredients() != null && !recipe.getIngredients().isEmpty()) {
            List<Ingredient> savedIngredients = new ArrayList<>();
            for (Ingredient ingredient : recipe.getIngredients()) {
                Ingredient savedIngredient = ingredientRepository.save(ingredient);
                savedIngredients.add(savedIngredient);
            }
            recipe.setIngredients(savedIngredients);
        }

        return recipeRepository.save(recipe);
    }

    public Recipe updateRecipe(Long id, Recipe recipeDetails, String username) {
        Recipe existingRecipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));

        User recipeAuthor = existingRecipe.getAuthorUser();
        if (recipeAuthor == null || !recipeAuthor.getUsername().equals(username)) {
            User user = userRepository.findByUsername(username);
            if (user == null || !user.getRole().equals("ADMIN")) {
                throw new SecurityException("You are not authorized to update this recipe");
            }
        }

        EnumValidator.validateDifficulty(recipeDetails.getDifficulty());
        EnumValidator.validateCuisineTypes(recipeDetails.getCuisineType());
        EnumValidator.validateCautions(recipeDetails.getCautions());
        EnumValidator.validateDietLabels(recipeDetails.getDietLabels());
        EnumValidator.validateDishTypes(recipeDetails.getDishTypes());
        EnumValidator.validateMealTypes(recipeDetails.getMealTypes());
        EnumValidator.validateHealthLabels(recipeDetails.getHealthLabels());

        if (recipeDetails.getLabel() != null) {
            existingRecipe.setLabel(recipeDetails.getLabel());
        }
        if (recipeDetails.getDescription() != null) {
            existingRecipe.setDescription(recipeDetails.getDescription());
        }
        if (recipeDetails.getPeople() != null) {
            existingRecipe.setPeople(recipeDetails.getPeople());
        }
        if (recipeDetails.getIngredients() != null) {
            List<Ingredient> savedIngredients = new ArrayList<>();
            for (Ingredient ingredient : recipeDetails.getIngredients()) {
                Ingredient savedIngredient = ingredientRepository.save(ingredient);
                savedIngredients.add(savedIngredient);
            }
            existingRecipe.setIngredients(savedIngredients);
        }
        existingRecipe.setDifficulty(recipeDetails.getDifficulty());
        if (recipeDetails.getDishTypes() != null) {
            existingRecipe.setDishTypes(recipeDetails.getDishTypes());
        }
        if (recipeDetails.getMealTypes() != null) {
            existingRecipe.setMealTypes(recipeDetails.getMealTypes());
        }
        if (recipeDetails.getCuisineType() != null) {
            existingRecipe.setCuisineType(recipeDetails.getCuisineType());
        }
        if (recipeDetails.getDietLabels() != null) {
            existingRecipe.setDietLabels(recipeDetails.getDietLabels());
        }
        if (recipeDetails.getHealthLabels() != null) {
            existingRecipe.setHealthLabels(recipeDetails.getHealthLabels());
        }
        if (recipeDetails.getCautions() != null) {
            existingRecipe.setCautions(recipeDetails.getCautions());
        }
        if (recipeDetails.getTotalTime() != null) {
            existingRecipe.setTotalTime(recipeDetails.getTotalTime());
        }

        if (recipeDetails.getTotalWeight() != null) {
            existingRecipe.setTotalWeight(recipeDetails.getTotalWeight());
        }
        if (recipeDetails.getCalories() != null) {
            existingRecipe.setCalories(recipeDetails.getCalories());
        }
        if (recipeDetails.getSteps() != null) {
            existingRecipe.setSteps(recipeDetails.getSteps());
        }
        if (recipeDetails.getImageString() != null) {
            existingRecipe.setImageString(recipeDetails.getImageString());
        }

        return recipeRepository.save(existingRecipe);
    }

    public void deleteRecipe(Long id, String username) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));

        User recipeAuthor = recipe.getAuthorUser();
        if (recipeAuthor == null || !recipeAuthor.getUsername().equals(username)) {
            User user = userRepository.findByUsername(username);
            if (user == null || !user.getRole().equals("ADMIN")) {
                throw new SecurityException("You are not authorized to delete this recipe");
            }
        }

        recipeRepository.delete(recipe);
    }

    public Object findAll() {
        List<Recipe> recipes = recipeRepository.findAll();
        Map<String, Object> response = new HashMap<>();
        response.put("recipes", recipes.stream().map(recipe -> {
            Map<String, Object> recipeMap = new HashMap<>();
            recipeMap.put("id", recipe.getId());
            recipeMap.put("label", recipe.getLabel());
            recipeMap.put("description", recipe.getDescription());
            recipeMap.put("difficulty", recipe.getDifficulty());
            recipeMap.put("totalTime", recipe.getTotalTime());
            recipeMap.put("calories", recipe.getCalories());
            if (recipe.getAuthor() != null) {
                Map<String, Object> authorMap = new HashMap<>();
                authorMap.put("username", recipe.getAuthor());
                recipeMap.put("author", authorMap);
            } else {
                recipeMap.put("author", null);
            }
            return recipeMap;
        }).collect(Collectors.toList()));
        return response;
    }

}
