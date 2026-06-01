package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.Ingredient;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.entity.Activity;
import com.blasetvrtumi.rarecips.entity.RecipeCollection;
import com.blasetvrtumi.rarecips.repository.IngredientRepository;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.repository.RecipeCollectionRepository;
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

    @Autowired
    private ActivityService activityService;

    @Autowired
    private RecipeCollectionRepository recipeCollectionRepository;

    @Autowired
    private MinioService minioService;

    public Recipe findById(Long id) {
        return recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));
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
        recipe.setPendingReview(!author.getRole().equals("ADMIN"));

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

    @SuppressWarnings("unchecked")
    public Recipe createRecipeFromMap(Map<String, Object> recipeData, String username) {
        Recipe recipe = new Recipe();
        recipe.setLabel((String) recipeData.get("label"));
        recipe.setDescription((String) recipeData.get("description"));
        recipe.setPeople((Integer) recipeData.get("people"));
        recipe.setDifficulty((Integer) recipeData.get("difficulty"));
        String imageString = (String) recipeData.get("imageString");
        if (imageString == null) {
            imageString = (String) recipeData.get("imageUrl");
        }
        if (imageString != null && !imageString.isEmpty()) {
            if (imageString.startsWith("http")) {
                recipe.setImageUrl(imageString);
            } else {
                recipe.setImageUrl(minioService.uploadBase64Image(imageString));
            }
        }
        recipe.setSteps((List<String>) recipeData.get("steps"));
        recipe.setCuisineType((List<String>) recipeData.get("cuisineType"));
        recipe.setCautions((List<String>) recipeData.get("cautions"));
        recipe.setDietLabels((List<String>) recipeData.get("dietLabels"));
        recipe.setDishTypes((List<String>) recipeData.get("dishTypes"));
        recipe.setMealTypes((List<String>) recipeData.get("mealTypes"));
        recipe.setHealthLabels((List<String>) recipeData.get("healthLabels"));

        Object totalTimeObj = recipeData.get("totalTime");
        if (totalTimeObj != null) {
            recipe.setTotalTime(((Number) totalTimeObj).floatValue());
        }
        Object caloriesObj = recipeData.get("calories");
        if (caloriesObj != null) {
            recipe.setCalories(((Number) caloriesObj).floatValue());
        }
        Object totalWeightObj = recipeData.get("totalWeight");
        if (totalWeightObj != null) {
            recipe.setTotalWeight(((Number) totalWeightObj).floatValue());
        }

        if (recipeData.containsKey("ingredients")) {
            List<Map<String, Object>> ingredientsData = (List<Map<String, Object>>) recipeData.get("ingredients");
            List<Ingredient> ingredients = new ArrayList<>();
            Map<Long, Float> quantities = new HashMap<>();
            Map<Long, String> units = new HashMap<>();

            for (Map<String, Object> ingData : ingredientsData) {
                String food = (String) ingData.get("food");
                String image = (String) ingData.get("image");
                String ingImageString = (String) ingData.get("imageString");
                if (ingImageString == null) ingImageString = (String) ingData.get("imageUrl");
                String imageUrl = null;
                if (ingImageString != null && !ingImageString.isEmpty()) {
                    imageUrl = minioService.uploadBase64Image(ingImageString);
                }
                Ingredient ingredient = new Ingredient(food, image, imageUrl);
                Ingredient savedIngredient = ingredientRepository.save(ingredient);
                ingredients.add(savedIngredient);

                Object quantityObj = ingData.get("quantity");
                if (quantityObj != null) {
                    quantities.put(savedIngredient.getId(), ((Number) quantityObj).floatValue());
                }

                String measure = (String) ingData.get("measure");
                if (measure != null) {
                    units.put(savedIngredient.getId(), measure);
                }
            }

            recipe.setIngredients(ingredients);
            recipe.setIngredientQuantities(quantities);
            recipe.setIngredientUnits(units);
        }

        return createRecipe(recipe, username);
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
        if (recipeDetails.getImageUrl() != null) {
            existingRecipe.setImageUrl(recipeDetails.getImageUrl());
        }
        if (recipeDetails.getIngredientQuantities() != null) {
            existingRecipe.setIngredientQuantities(recipeDetails.getIngredientQuantities());
        }
        if (recipeDetails.getIngredientUnits() != null) {
            existingRecipe.setIngredientUnits(recipeDetails.getIngredientUnits());
        }

        return recipeRepository.save(existingRecipe);
    }

    public Recipe updateRecipeFromMap(Long id, Map<String, Object> recipeData, String username) {
        Recipe existingRecipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));

        User recipeAuthor = existingRecipe.getAuthorUser();
        if (recipeAuthor == null || !recipeAuthor.getUsername().equals(username)) {
            User user = userRepository.findByUsername(username);
            if (user == null || !user.getRole().equals("ADMIN")) {
                throw new SecurityException("You are not authorized to update this recipe");
            }
        }

        if (recipeData.containsKey("label")) {
            existingRecipe.setLabel((String) recipeData.get("label"));
        }
        if (recipeData.containsKey("description")) {
            existingRecipe.setDescription((String) recipeData.get("description"));
        }
        if (recipeData.containsKey("people")) {
            existingRecipe.setPeople((Integer) recipeData.get("people"));
        }
        if (recipeData.containsKey("difficulty")) {
            Integer difficulty = (Integer) recipeData.get("difficulty");
            existingRecipe.setDifficulty(difficulty);
            EnumValidator.validateDifficulty(difficulty);
        }
        if (recipeData.containsKey("imageString") || recipeData.containsKey("imageUrl")) {
            String imageString = (String) recipeData.get("imageString");
            if (imageString == null) {
                imageString = (String) recipeData.get("imageUrl");
            }
            if (imageString != null && !imageString.isEmpty()) {
                if (imageString.startsWith("http")) {
                    existingRecipe.setImageUrl(imageString);
                } else {
                    existingRecipe.setImageUrl(minioService.uploadBase64Image(imageString));
                }
            }
        }
        if (recipeData.containsKey("steps")) {
            existingRecipe.setSteps((List<String>) recipeData.get("steps"));
        }
        if (recipeData.containsKey("cuisineType")) {
            List<String> cuisineType = (List<String>) recipeData.get("cuisineType");
            existingRecipe.setCuisineType(cuisineType);
            if (cuisineType != null) EnumValidator.validateCuisineTypes(cuisineType);
        }
        if (recipeData.containsKey("cautions")) {
            List<String> cautions = (List<String>) recipeData.get("cautions");
            existingRecipe.setCautions(cautions);
            if (cautions != null) EnumValidator.validateCautions(cautions);
        }
        if (recipeData.containsKey("dietLabels")) {
            List<String> dietLabels = (List<String>) recipeData.get("dietLabels");
            existingRecipe.setDietLabels(dietLabels);
            if (dietLabels != null) EnumValidator.validateDietLabels(dietLabels);
        }
        if (recipeData.containsKey("dishTypes")) {
            List<String> dishTypes = (List<String>) recipeData.get("dishTypes");
            existingRecipe.setDishTypes(dishTypes);
            if (dishTypes != null) EnumValidator.validateDishTypes(dishTypes);
        }
        if (recipeData.containsKey("mealTypes")) {
            List<String> mealTypes = (List<String>) recipeData.get("mealTypes");
            existingRecipe.setMealTypes(mealTypes);
            if (mealTypes != null) EnumValidator.validateMealTypes(mealTypes);
        }
        if (recipeData.containsKey("healthLabels")) {
            List<String> healthLabels = (List<String>) recipeData.get("healthLabels");
            existingRecipe.setHealthLabels(healthLabels);
            if (healthLabels != null) EnumValidator.validateHealthLabels(healthLabels);
        }
        if (recipeData.containsKey("totalTime")) {
            Object totalTimeObj = recipeData.get("totalTime");
            if (totalTimeObj != null) {
                existingRecipe.setTotalTime(((Number) totalTimeObj).floatValue());
            }
        }
        if (recipeData.containsKey("calories")) {
            Object caloriesObj = recipeData.get("calories");
            if (caloriesObj != null) {
                existingRecipe.setCalories(((Number) caloriesObj).floatValue());
            }
        }
        if (recipeData.containsKey("totalWeight")) {
            Object totalWeightObj = recipeData.get("totalWeight");
            if (totalWeightObj != null) {
                existingRecipe.setTotalWeight(((Number) totalWeightObj).floatValue());
            }
        }

        if (recipeData.containsKey("ingredients")) {
            List<Map<String, Object>> ingredientsData = (List<Map<String, Object>>) recipeData.get("ingredients");
            List<Ingredient> ingredients = new ArrayList<>();
            Map<Long, Float> quantities = new HashMap<>();
            Map<Long, String> units = new HashMap<>();

            for (Map<String, Object> ingData : ingredientsData) {
                String food = (String) ingData.get("food");
                String image = (String) ingData.get("image");
                String imageString = (String) ingData.get("imageString");
                if (imageString == null) imageString = (String) ingData.get("imageUrl");
                String imageUrl = null;
                if (imageString != null && !imageString.isEmpty()) {
                    if (imageString.startsWith("http")) {
                        imageUrl = imageString;
                    } else {
                        imageUrl = minioService.uploadBase64Image(imageString);
                    }
                }
                Ingredient ingredient = new Ingredient(food, image, imageUrl);
                Ingredient savedIngredient = ingredientRepository.save(ingredient);
                ingredients.add(savedIngredient);

                Object quantityObj = ingData.get("quantity");
                if (quantityObj != null) {
                    quantities.put(savedIngredient.getId(), ((Number) quantityObj).floatValue());
                }

                String measure = (String) ingData.get("measure");
                if (measure != null) {
                    units.put(savedIngredient.getId(), measure);
                }
            }

            existingRecipe.setIngredients(ingredients);
            existingRecipe.setIngredientQuantities(quantities);
            existingRecipe.setIngredientUnits(units);
        }

        return recipeRepository.save(existingRecipe);
    }

    @Transactional
    public void deleteRecipe(Long id, String username) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));

        List<RecipeCollection> collections = recipeCollectionRepository.findAll();
        for (RecipeCollection collection : collections) {
            if (collection.getRecipes().contains(recipe)) {
                collection.removeRecipe(recipe);
                recipeCollectionRepository.save(collection);
            }
        }

        List<User> allUsers = userRepository.findAll();
        for (User u : allUsers) {
            if (u.getSavedRecipes().contains(recipe)) {
                u.getSavedRecipes().remove(recipe);
                userRepository.save(u);
            }
        }

        String recipeLabel = recipe.getLabel();
        recipeRepository.delete(recipe);
        activityService.logActivity(username, Activity.ActivityType.DELETE_RECIPE, recipeLabel,
            username + " deleted recipe \"" + recipeLabel + "\"",
            id,
            null
        );
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

    public Page<Recipe> getRecommendedRecipes(String username, int page, int size) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found: " + username);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        RecipeCollection favoritesCollection = recipeCollectionRepository.findByUserAndIsFavoritesTrue(user).orElse(null);
        
        if (favoritesCollection == null || favoritesCollection.getRecipes().isEmpty()) {
            return recipeRepository.findAllOrderByReviewsCountDesc(pageable);
        }

        List<Recipe> favorites = favoritesCollection.getRecipes();
        List<Long> excludeIds = favorites.stream().map(Recipe::getId).collect(Collectors.toList());
        
        List<String> cuisineTypes = new ArrayList<>();
        List<String> dishTypes = new ArrayList<>();
        List<String> dietLabels = new ArrayList<>();

        for (Recipe r : favorites) {
            if (r.getCuisineType() != null) cuisineTypes.addAll(r.getCuisineType());
            if (r.getDishTypes() != null) dishTypes.addAll(r.getDishTypes());
            if (r.getDietLabels() != null) dietLabels.addAll(r.getDietLabels());
        }

        cuisineTypes = cuisineTypes.stream().distinct().collect(Collectors.toList());
        dishTypes = dishTypes.stream().distinct().collect(Collectors.toList());
        dietLabels = dietLabels.stream().distinct().collect(Collectors.toList());

        if (cuisineTypes.isEmpty()) cuisineTypes.add("__DUMMY__");
        if (dishTypes.isEmpty()) dishTypes.add("__DUMMY__");
        if (dietLabels.isEmpty()) dietLabels.add("__DUMMY__");
        if (excludeIds.isEmpty()) excludeIds.add(-1L);

        Page<Recipe> recommendations = recipeRepository.findRecommendations(excludeIds, cuisineTypes, dishTypes, dietLabels, pageable);
        
        if (recommendations.isEmpty() && page == 0) {
            return recipeRepository.findAllOrderByReviewsCountDesc(pageable);
        }

        return recommendations;
    }

    public List<Long> getUserIngredientIds(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User must be authenticated");
        }
        String username = authentication.getName();
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found: " + username);
        }
        if (user.getIngredients() == null || user.getIngredients().isEmpty()) {
            return new ArrayList<>();
        }
        return user.getIngredients().stream()
                .map(Ingredient::getId)
                .collect(Collectors.toList());
    }

}
