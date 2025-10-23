package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.sql.Blob;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Entity
public class Recipe {

    public interface BasicInfo {
    }

    public interface dietLabelsInfo {
    }

    public interface healthLabelsInfo {
    }

    public interface cautionsInfo {
    }

    @Id
    @JsonView(BasicInfo.class)
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @JsonView(BasicInfo.class)
    private String label;

    @JsonView(BasicInfo.class)
    String description;

    @Lob
    @JsonIgnore
    private Blob imageFile;

    @JsonView(BasicInfo.class)
    @Lob
    private String imageString;

    @JsonView(BasicInfo.class)
    private Integer people;

    @JsonView(BasicInfo.class)
    @ManyToMany
    private List<Ingredient> ingredients = new ArrayList<>();

    @JsonView(BasicInfo.class)
    private int difficulty;

    @JsonView(BasicInfo.class)
    @ElementCollection
    private List<String> dishTypes = new ArrayList<>();

    @JsonView(BasicInfo.class)
    @ElementCollection
    private List<String> mealTypes = new ArrayList<>();

    @ElementCollection
    @JsonView(BasicInfo.class)
    private List<String> cuisineType = new ArrayList<>();

    @JsonView(BasicInfo.class)
    @ElementCollection
    private List<String> dietLabels = new ArrayList<>();

    @JsonView(BasicInfo.class)
    @ElementCollection
    private List<String> healthLabels = new ArrayList<>();

    @JsonView(BasicInfo.class)
    @ElementCollection
    private List<String> cautions = new ArrayList<>();

    @JsonView(BasicInfo.class)
    private Float totalTime;

    @JsonView(BasicInfo.class)
    private Float totalWeight;

    @JsonView(BasicInfo.class)
    private Float calories;

    @JsonView(BasicInfo.class)
    private Float rating;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonView(BasicInfo.class)
    @JoinColumn(name = "author_username", referencedColumnName = "username")
    private User author;

    @ElementCollection
    @JsonView(BasicInfo.class)
    private List<String> steps = new ArrayList<>();

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL)
    @JsonView(BasicInfo.class)
    private List<Review> reviews = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Recipe() {
        // Default constructor
    }

    public Recipe(String label, String description, List<String> dietLabels, List<String> healthLabels, List<String> cautions,
            Integer people, List<Ingredient> ingredients,
            int difficulty, List<String> dishTypes, List<String> mealTypes, List<String> cuisineType,
            Float totalTime, Float totalWeight, Float calories, User author, List<String> steps) {
        this.label = label;
        this.description = description;
        this.dietLabels = dietLabels;
        this.healthLabels = healthLabels;
        this.cautions = cautions;
        this.people = people;
        this.ingredients = ingredients;
        this.difficulty = difficulty;
        this.dishTypes = dishTypes;
        this.mealTypes = mealTypes;
        this.cuisineType = cuisineType;
        this.totalTime = totalTime;
        this.totalWeight = totalWeight;
        this.calories = calories;
        this.author = author;
        this.steps = steps;
    }

    public Blob localImageToBlob(String imagePath) throws IOException, SQLException {
        try {
            ClassPathResource imageResource = new ClassPathResource(imagePath);
            if (imageResource.exists()) {
                InputStream imageStream = imageResource.getInputStream();

                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                int bytesRead;
                byte[] data = new byte[8192];

                while ((bytesRead = imageStream.read(data, 0, data.length)) != -1) {
                    buffer.write(data, 0, bytesRead);
                }

                byte[] imageBytes = buffer.toByteArray();
                Blob imageBlob = new javax.sql.rowset.serial.SerialBlob(imageBytes);

                imageStream.close();
                buffer.close();
                return imageBlob;
            } else {
                System.out.println("Image not found: " + imagePath);
            }
        } catch (IOException | SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public String blobToString(Blob blob) throws SQLException {
        if (blob == null) {
            return null;
        }
        byte[] bytes = blob.getBytes(1, (int) blob.length());
        String userImage = Base64.getEncoder().encodeToString(bytes);
        return userImage;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Blob getImageFile() {
        return imageFile;
    }

    public String getImageString() {
        return imageString;
    }

    public Integer getPeople() {
        return people;
    }

    public void setPeople(Integer people) {
        this.people = people;
    }

    public List<Ingredient> getIngredients() {
        return ingredients;
    }

    public void setIngredients(List<Ingredient> ingredients) {
        this.ingredients = ingredients;
    }

    public int getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(int difficulty) {
        this.difficulty = difficulty;
    }

    public List<String> getDishTypes() {
        return dishTypes;
    }

    public void setDishTypes(List<String> dishTypes) {
        this.dishTypes = dishTypes;
    }

    public List<String> getMealTypes() {
        return mealTypes;
    }

    public void setMealTypes(List<String> mealTypes) {
        this.mealTypes = mealTypes;
    }

    public List<String> getCuisineType() {
        return cuisineType;
    }

    public void setCuisineType(List<String> cuisineType) {
        this.cuisineType = cuisineType;
    }

    public List<String> getDietLabels() {
        return dietLabels;
    }

    public void setDietLabels(List<String> dietLabels) {
        this.dietLabels = dietLabels;
    }

    public List<String> getHealthLabels() {
        return healthLabels;
    }

    public void setHealthLabels(List<String> healthLabels) {
        this.healthLabels = healthLabels;
    }

    public List<String> getCautions() {
        return cautions;
    }

    public void setCautions(List<String> cautions) {
        this.cautions = cautions;
    }

    public String getDescription() {
        return description;
    }

    public Float getTotalTime() {
        return totalTime;
    }

    public void setTotalTime(Float totalTime) {
        this.totalTime = totalTime;
    }

    public Float getTotalWeight() {
        return totalWeight;
    }

    public void setTotalWeight(Float totalWeight) {
        this.totalWeight = totalWeight;
    }

    public Float getCalories() {
        return calories;
    }

    public void setCalories(Float calories) {
        this.calories = calories;
    }

    public Float getRating() {
        return rating;
    }

    public void setRating(Float rating) {
        this.rating = rating;
    }

    public void setAuthor(User author) {
        this.author = author;
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

    public String getAuthor() {
        if (author == null) {
            return null;
        }
        return author.getUsername();
    }

    public List<Review> getReviews() {
        return reviews;
    }

    public void setReviews(List<Review> reviews) {
        this.reviews = reviews;
        for (Review review : reviews) {
            review.setRecipe(this);
        }
    }

    public void setImageString(String imageString) {
        this.imageString = imageString;
    }

    public void setImageFile(Blob imageFile) {
        this.imageFile = imageFile;
    }

    public void updateRating() {
        float sum = 0;
        for (Review review : reviews) {
            if (review.getRating() != null) {
                sum += review.getRating();
            }
        }
        if (reviews.isEmpty()) {
            this.rating = 0.0f;
            return;
        }
        this.rating = (Float) sum / reviews.size();
    }

    public List<String> getSteps() {
        return steps;
    }

}
