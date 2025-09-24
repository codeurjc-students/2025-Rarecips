package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.repository.*;
import com.blasetvrtumi.rarecips.entity.*; // Agregar este import
import jakarta.annotation.PostConstruct;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.sql.Blob;
import java.io.IOException;
import java.sql.SQLException;

@Service
public class RecipeInitializationService {

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private JSONArray recipes;

    @PostConstruct
    public void init() {

        if (recipes != null && recipes.length() > 0) {

            // Add all recipes from the JSON file to the database
            for (int i = 0; i < recipes.length() - 1; i++) {
                JSONObject recipeJson = recipes.getJSONObject(i);

                String label = recipeJson.optString("label", null);

                List<String> dietLabels = recipeJson.optJSONArray("dietLabels", new JSONArray()).toList().stream()
                        .map(Object::toString)
                        .toList();

                List<String> healthLabels = recipeJson.optJSONArray("healthLabels", new JSONArray()).toList().stream()
                        .map(Object::toString)
                        .toList();

                List<String> cautions = recipeJson.optJSONArray("cautions", new JSONArray()).toList().stream()
                        .map(Object::toString)
                        .toList();

                int people = recipeJson.optInt("people", 0);

                // Ingredients entity!!
                List<Ingredient> ingredients;

                if (recipeJson.isNull("ingredients")) {
                    ingredients = new ArrayList<>();
                } else {
                    ingredients = recipeJson.optJSONArray("ingredients", new JSONArray()).toList().stream()
                    .map(obj -> {
                        JSONObject ingredientJson = new JSONObject((HashMap<?, ?>) obj);
                        Food food = foodRepository.findByName(ingredientJson.optString("food"));
                        if (food == null) {
                            food = new Food(ingredientJson.optString("food"),
                                    ingredientJson.optString("foodCategory", null),
                                    ingredientJson.optString("image", null));
                        }
                        foodRepository.save(food);
                        String description = ingredientJson.optString("text", null);
                        Float quantity = ingredientJson.optFloat("quantity", 0.0f);
                        String measure = ingredientJson.optString("measure", "<unit>");
                        Float weight = ingredientJson.optFloat("weight", 0.0f);
                        String category = ingredientJson.optString("foodCategory", null);
                        Ingredient ingredient = new Ingredient(food, description, quantity, measure, weight);
                        ingredientRepository.save(ingredient);
                        return ingredient;
                    })
                    .toList();
                }

                int difficulty = recipeJson.optInt("difficulty", 0);

                List<String> dishTypes = recipeJson.optJSONArray("dishType", new JSONArray()).toList().stream()
                        .map(Object::toString)
                        .toList();

                List<String> mealTypes = recipeJson.optJSONArray("mealType", new JSONArray()).toList().stream()
                        .map(Object::toString)
                        .toList();

                List<String> cuisineType = recipeJson.optJSONArray("cuisineType", new JSONArray()).toList().stream()
                        .map(Object::toString)
                        .toList();

                Float totalTime = recipeJson.optFloat("totalTime", 0.0f);
                Float totalWeight = recipeJson.optFloat("totalWeight", 0.0f);
                Float calories = recipeJson.optFloat("calories", 0.0f);

                User recipeAuthor = userRepository.findByUsername(recipeJson.optString("owner"));

                if (recipeAuthor == null) {
                    // If the author does not exist, create a default user
                    recipeAuthor = new User("user", "", "", null, "", "", "");
                    userRepository.save(recipeAuthor);
                }

                // Create a new Recipe object
                Recipe recipe = new Recipe(label, dietLabels, healthLabels, cautions,
                        people, ingredients, difficulty, dishTypes, mealTypes, cuisineType, totalTime,
                        totalWeight, calories, recipeAuthor);

                // Save the new recipe to the database
                recipeRepository.save(recipe);


                // Reviews entity!!
                List<Review> reviews;

                if (recipeJson.isNull("reviews")) {
                    reviews = new ArrayList<>();
                } else {
                    reviews = recipeJson.optJSONArray("reviews", new JSONArray()).toList().stream()
                            .map(obj -> {
                                JSONObject reviewJson = new JSONObject((HashMap<?, ?>) obj);
                                User reviewAuthor = userRepository.findByUsername(reviewJson.optString("author"));
                                Float rating = reviewJson.optFloat("rating", 0.0f);
                                String comment = reviewJson.optString("comment", null);
                                Recipe relRecipe = recipeRepository.findById(recipeJson.optLong("id")).orElse(null);
                                LocalDateTime createdAt = LocalDateTime.parse(reviewJson.optString("createdAt", LocalDateTime.now().toString()));
                                Review review = new Review(relRecipe, reviewAuthor, rating, comment, createdAt, null);
                                reviewRepository.save(review);
                                return review;
                            })
                            .toList();
                }

                recipe.setReviews(reviews);
                String imageString = "static/assets/img/" + recipe.getId() + ".jpg";
                try {
                    Blob imageBlob = recipe.localImageToBlob(imageString);
                    recipe.setImageFile(imageBlob);
                    recipe.setImageString(recipe.blobToString(imageBlob));
                } catch (IOException | SQLException e) {
                    recipe.setImageFile(null);
                    recipe.setImageString(null);
                    System.out.println("Error loading image for recipe " + recipe.getId() + ": " + e.getMessage());
                }

                recipe.updateRating();

                recipeRepository.save(recipe);

            }
            System.out.println("Recipes initialized from JSON file successfully.");
        } else {
            System.out.println("No recipes found in the JSON file.");
        }
    }

}


