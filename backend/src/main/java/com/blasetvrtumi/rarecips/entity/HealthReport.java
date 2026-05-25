package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

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
    private Float totalWeight;

    @JsonView(BasicInfo.class)
    private Float totalTime;

    @JsonView(BasicInfo.class)
    private Float averageCalories;

    @JsonView(BasicInfo.class)
    private Float averageDifficulty;

    @JsonView(BasicInfo.class)
    private Float averagePeople;

    @JsonView(BasicInfo.class)
    private int recipesAnalyzed;

    @JsonView(BasicInfo.class)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "health_report_diet_labels", joinColumns = @JoinColumn(name = "health_report_id"))
    @MapKeyColumn(name = "label")
    @Column(name = "count")
    private Map<String, Integer> dietLabelsCount = new HashMap<>();

    @JsonView(BasicInfo.class)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "health_report_health_labels", joinColumns = @JoinColumn(name = "health_report_id"))
    @MapKeyColumn(name = "label")
    @Column(name = "count")
    private Map<String, Integer> healthLabelsCount = new HashMap<>();

    @JsonView(BasicInfo.class)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "health_report_cautions", joinColumns = @JoinColumn(name = "health_report_id"))
    @MapKeyColumn(name = "label")
    @Column(name = "count")
    private Map<String, Integer> cautionsCount = new HashMap<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    @JsonView(BasicInfo.class)
    private LocalDateTime createdAt;

    public HealthReport() {
    }

    public HealthReport(User user,
                        String generatedSummary,
                        Float totalCalories,
                        Float totalWeight,
                        Float totalTime,
                        Float averageCalories,
                        Float averageDifficulty,
                        Float averagePeople,
                        int recipesAnalyzed,
                        Map<String, Integer> dietLabelsCount,
                        Map<String, Integer> healthLabelsCount,
                        Map<String, Integer> cautionsCount) {
        this.user = user;
        this.generatedSummary = generatedSummary;
        this.totalCalories = totalCalories;
        this.totalWeight = totalWeight;
        this.totalTime = totalTime;
        this.averageCalories = averageCalories;
        this.averageDifficulty = averageDifficulty;
        this.averagePeople = averagePeople;
        this.recipesAnalyzed = recipesAnalyzed;
        if (dietLabelsCount != null) this.dietLabelsCount = dietLabelsCount;
        if (healthLabelsCount != null) this.healthLabelsCount = healthLabelsCount;
        if (cautionsCount != null) this.cautionsCount = cautionsCount;
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

    public Float getTotalWeight() {
        return totalWeight;
    }

    public void setTotalWeight(Float totalWeight) {
        this.totalWeight = totalWeight;
    }

    public Float getTotalTime() {
        return totalTime;
    }

    public void setTotalTime(Float totalTime) {
        this.totalTime = totalTime;
    }

    public Float getAverageCalories() {
        return averageCalories;
    }

    public void setAverageCalories(Float averageCalories) {
        this.averageCalories = averageCalories;
    }

    public Float getAverageDifficulty() {
        return averageDifficulty;
    }

    public void setAverageDifficulty(Float averageDifficulty) {
        this.averageDifficulty = averageDifficulty;
    }

    public Float getAveragePeople() {
        return averagePeople;
    }

    public void setAveragePeople(Float averagePeople) {
        this.averagePeople = averagePeople;
    }

    public int getRecipesAnalyzed() {
        return recipesAnalyzed;
    }

    public void setRecipesAnalyzed(int recipesAnalyzed) {
        this.recipesAnalyzed = recipesAnalyzed;
    }

    public Map<String, Integer> getDietLabelsCount() {
        return dietLabelsCount;
    }

    public void setDietLabelsCount(Map<String, Integer> dietLabelsCount) {
        this.dietLabelsCount = dietLabelsCount;
    }

    public Map<String, Integer> getHealthLabelsCount() {
        return healthLabelsCount;
    }

    public void setHealthLabelsCount(Map<String, Integer> healthLabelsCount) {
        this.healthLabelsCount = healthLabelsCount;
    }

    public Map<String, Integer> getCautionsCount() {
        return cautionsCount;
    }

    public void setCautionsCount(Map<String, Integer> cautionsCount) {
        this.cautionsCount = cautionsCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

}
