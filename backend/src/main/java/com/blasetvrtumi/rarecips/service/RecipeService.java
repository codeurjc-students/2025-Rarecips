package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
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
        System.out.println(recipes.getContent().get(0).getId());
        return recipes;
    }

}
