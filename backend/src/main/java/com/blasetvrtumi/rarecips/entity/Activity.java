package com.blasetvrtumi.rarecips.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String activityType;
    private String recipeName;
    private String description;
    private LocalDateTime timestamp;
    private Long recipeId;
    private Long collectionId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }
    public String getRecipeName() { return recipeName; }
    public void setRecipeName(String recipeName) { this.recipeName = recipeName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public Long getRecipeId() { return recipeId; }
    public void setRecipeId(Long recipeId) { this.recipeId = recipeId; }
    public Long getCollectionId() { return collectionId; }
    public void setCollectionId(Long collectionId) { this.collectionId = collectionId; }

    public enum ActivityType {
        CREATE_RECIPE,
        UPDATE_RECIPE,
        DELETE_RECIPE,
        CREATE_REVIEW,
        UPDATE_REVIEW,
        DELETE_REVIEW,
        CREATE_COLLECTION,
        UPDATE_COLLECTION,
        DELETE_COLLECTION,
        ADD_RECIPE_TO_COLLECTION
    }
}

