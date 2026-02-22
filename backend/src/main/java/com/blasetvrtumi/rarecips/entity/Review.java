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
    @Column(columnDefinition = "TEXT")
    private String comment;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User author;

    @JsonView(BasicInfo.class)
    @Transient
    private String authorUsername;

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

    public void setRating(Float rating) {
        this.rating = rating;
    }

    public Recipe getRecipe() {
        return recipe;
    }

    public void setRecipe(Recipe recipe) {
        this.recipe = recipe;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public String getAuthorUsername() {
        return author != null ? author.getUsername() : null;
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
}
