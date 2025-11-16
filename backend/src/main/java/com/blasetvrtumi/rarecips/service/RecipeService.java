package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        return recipeRepository.save(recipe);
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
