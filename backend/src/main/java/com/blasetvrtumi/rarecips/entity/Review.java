package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
public class Review {

    public interface BasicInfo {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonView(BasicInfo.class)
    @ManyToOne
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @JsonView(BasicInfo.class)
    private Float rating;

    @JsonView(BasicInfo.class)
    private String comment;

    @ManyToOne
    @JsonView(BasicInfo.class)
    @JoinColumn(name = "user_id")
    private User author;

    @CreationTimestamp
    @JsonView(BasicInfo.class)
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @JsonView(BasicInfo.class)
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Review() {
    }

    public Review(Recipe recipe, User author, Float rating, String comment, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.recipe = recipe;
        this.rating = rating;
        this.comment = comment;
        this.author = author;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }


    public Float getRating() {
        return rating != null ? rating : 0.0f;
    }

    public void setRecipe(Recipe recipe) {
        this.recipe = recipe;
    }


}
