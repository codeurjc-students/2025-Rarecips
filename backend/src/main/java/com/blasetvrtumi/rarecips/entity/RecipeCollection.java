package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class RecipeCollection {

    public interface BasicInfo extends Recipe.BasicInfo {}

    @Id
    @JsonView(BasicInfo.class)
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @JsonView(BasicInfo.class)
    @Column(nullable = false)
    private String title;

    @JsonView(BasicInfo.class)
    private boolean isFavorites = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    @JoinColumn(name = "user_username", nullable = false)
    private User user;

    @ManyToMany
    @JoinTable(
            name = "collection_recipes",
            joinColumns = @JoinColumn(name = "collection_id"),
            inverseJoinColumns = @JoinColumn(name = "recipe_id")
    )
    @JsonView(BasicInfo.class)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<Recipe> recipes = new ArrayList<>();

    @CreationTimestamp
    @JsonView(BasicInfo.class)
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @JsonView(BasicInfo.class)
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public RecipeCollection() {
    }

    public RecipeCollection(String title, User user, boolean isFavorites) {
        this.title = title;
        this.user = user;
        this.isFavorites = isFavorites;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isFavorites() {
        return isFavorites;
    }

    public void setFavorites(boolean favorites) {
        isFavorites = favorites;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<Recipe> getRecipes() {
        return recipes;
    }

    public void setRecipes(List<Recipe> recipes) {
        this.recipes = recipes;
    }

    public void addRecipe(Recipe recipe) {
        if (!this.recipes.contains(recipe)) {
            this.recipes.add(recipe);
        }
    }

    public void removeRecipe(Recipe recipe) {
        this.recipes.remove(recipe);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @JsonView(BasicInfo.class)
    public int getRecipeCount() {
        return this.recipes != null ? this.recipes.size() : 0;
    }

    @JsonView(BasicInfo.class)
    public String getAuthor() {
        return this.user != null ? this.user.getUsername() : null;
    }
}

