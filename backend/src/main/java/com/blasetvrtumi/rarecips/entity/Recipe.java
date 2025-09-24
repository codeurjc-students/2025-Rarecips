package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @SequenceGenerator(name = "seq", initialValue = 0)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq")
    private Long id;
    
    @JsonView(BasicInfo.class)
    private String label;

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
    private List<String> cuisineType = new ArrayList<>();

    @JsonView(dietLabelsInfo.class)
    @ElementCollection
    private List<String> dietLabels = new ArrayList<>();

    @JsonView(healthLabelsInfo.class)
    @ElementCollection
    private List<String> healthLabels = new ArrayList<>();

    @JsonView(cautionsInfo.class)
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

    @ManyToOne
    @JoinColumn(name = "author")
    private User author;
    
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL)
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

    public Recipe(String label, List<String> dietLabels, List<String> healthLabels, List<String> cautions, Integer people, List<Ingredient> ingredients,
                  int difficulty, List<String> dishTypes, List<String> mealTypes, List<String> cuisineType,
                  Float totalTime, Float totalWeight, Float calories, User author) {
        this.label = label;
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
        byte[] bytes = blob.getBytes(1, (int) blob.length());
        String userImage = Base64.getEncoder().encodeToString(bytes);
        return userImage;
    }

    public Long getId() {
        return id;
    }

    public User getAuthor() {
        return author;
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

}
