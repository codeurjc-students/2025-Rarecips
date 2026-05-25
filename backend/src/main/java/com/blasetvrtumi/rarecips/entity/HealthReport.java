package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
public class HealthReport {

    public interface BasicInfo {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonView(BasicInfo.class)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_username")
    @JsonIgnoreProperties({"recipes", "reviews", "savedRecipes", "hibernateLazyInitializer", "handler"})
    private User user;

    @Column(columnDefinition = "TEXT")
    @JsonView(BasicInfo.class)
    private String generatedSummary;

    @JsonView(BasicInfo.class)
    private Float totalCalories;

    @JsonView(BasicInfo.class)
    private int recipesAnalyzed;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    @JsonView(BasicInfo.class)
    private LocalDateTime createdAt;

    public HealthReport() {
    }

    public HealthReport(User user, String generatedSummary, Float totalCalories, int recipesAnalyzed) {
        this.user = user;
        this.generatedSummary = generatedSummary;
        this.totalCalories = totalCalories;
        this.recipesAnalyzed = recipesAnalyzed;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getGeneratedSummary() {
        return generatedSummary;
    }

    public void setGeneratedSummary(String generatedSummary) {
        this.generatedSummary = generatedSummary;
    }

    public Float getTotalCalories() {
        return totalCalories;
    }

    public void setTotalCalories(Float totalCalories) {
        this.totalCalories = totalCalories;
    }

    public int getRecipesAnalyzed() {
        return recipesAnalyzed;
    }

    public void setRecipesAnalyzed(int recipesAnalyzed) {
        this.recipesAnalyzed = recipesAnalyzed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

}
