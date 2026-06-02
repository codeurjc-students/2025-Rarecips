package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Entity
public class User {
    private static final Logger logger = LoggerFactory.getLogger(User.class);

    public interface BasicInfo {
    }

    public interface Username {
    }

    public interface Reviews {
    }

    public interface Recipes {
    }

    @JsonView({BasicInfo.class, Username.class})
    @Id
    @Column(unique = true, nullable = false)
    private String username;

    @JsonView(BasicInfo.class)
    private String displayName;

    @JsonView(BasicInfo.class)
    private String bio;

    @JsonView(BasicInfo.class)
    @Lob
    private String profileImageUrl;

    @JsonView(BasicInfo.class)
    private String email;

    @JsonIgnore
    private String password;

    @Enumerated(EnumType.STRING)
    @JsonView(BasicInfo.class)
    private Role role = Role.USER;

    @CreationTimestamp
    @JsonView(BasicInfo.class)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @JsonView(BasicInfo.class)
    private LocalDateTime lastOnline;

    // Different lists of elements that the user has

    // Recipes a user has created
    @JsonIgnore
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL)
    private List<Recipe> recipes = new ArrayList<>();

    // Reviews a user has made
    @JsonIgnore
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL)
    private Set<Review> reviews = new HashSet<>();

    // Ingredients a user has stored
    @JsonIgnore
    @ManyToMany(cascade = {CascadeType.ALL})
    private List<Ingredient> ingredients = new ArrayList<>();

    // Recipes a user has saved
    @ManyToMany
    @JoinTable(name = "user_saved_recipes",
            joinColumns = @JoinColumn(name = "username"),
            inverseJoinColumns = @JoinColumn(name = "recipe_id"))
    private List<Recipe> savedRecipes = new ArrayList<>();

    @JsonView(BasicInfo.class)
    @Column(name = "private_profile", nullable = false)
    private boolean privateProfile = false;

    @JsonView(BasicInfo.class)
    @Column(name = "suspended", nullable = false)
    private boolean suspended = false;

    @JsonView(BasicInfo.class)
    @Column(name = "reported", nullable = false)
    private boolean reported = false;

    public boolean isReported() {
        return reported;
    }

    public void setReported(boolean reported) {
        this.reported = reported;
    }

    @Column(name = "password_reset_token")
    private String passwordResetToken;

    @Column(name = "password_reset_token_expiry")
    private LocalDateTime passwordResetTokenExpiry;

    public enum Role {
        USER, ADMIN
    }

    public User() {
    }

    public User(String username, String displayName, String bio, String profileImageUrl, String email, String password) {
        this.username = username;
        this.displayName = displayName;
        this.bio = bio;
        this.email = email;
        this.password = password;
        this.profileImageUrl = profileImageUrl;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getBio() {
        return bio;
    }

    public String getRole() {
        return role.name();
    }

    public void setRole(String role) {
        this.role = Role.valueOf(role);
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setLastOnline(LocalDateTime lastOnline) {
        this.lastOnline = lastOnline;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getProfileImageUrl() {
        if (profileImageUrl == null) return null;
        String externalUrl = com.blasetvrtumi.rarecips.service.MinioService.staticMinioUrl;
        if (externalUrl != null && !externalUrl.isEmpty()) {
            if (externalUrl.endsWith("/")) {
                externalUrl = externalUrl.substring(0, externalUrl.length() - 1);
            }
            if (profileImageUrl.contains("localhost:9000")) {
                return profileImageUrl.replace("http://localhost:9000", externalUrl);
            }
            if (profileImageUrl.contains("rarecips-minio:9000")) {
                return profileImageUrl.replace("http://rarecips-minio:9000", externalUrl);
            }
        }
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public void setIngredients(List<Ingredient> ingredients) {
        this.ingredients = ingredients;
    }

    public List<Ingredient> getIngredients() {
        return ingredients;
    }

    public void addIngredient(Ingredient ingredient) {
        this.ingredients.add(ingredient);
    }

    @JsonView(BasicInfo.class)
    public int getRecipesCount() {
        return this.recipes != null ? this.recipes.size() : 0;
    }

    @JsonView(BasicInfo.class)
    public int getReviewsCount() {
        return this.reviews != null ? this.reviews.size() : 0;
    }

    @JsonView(BasicInfo.class)
    public int getSavedRecipesCount() {
        return this.savedRecipes != null ? this.savedRecipes.size() : 0;
    }

    public List<Recipe> getSavedRecipes() {
        return savedRecipes;
    }

    public void setSavedRecipes(List<Recipe> savedRecipes) {
        this.savedRecipes = savedRecipes;
    }

    public boolean isPrivateProfile() {
        return privateProfile;
    }

    public void setPrivateProfile(boolean privateProfile) {
        this.privateProfile = privateProfile;
    }

    public boolean isSuspended() {
        return suspended;
    }

    public void setSuspended(boolean suspended) {
        this.suspended = suspended;
    }

    public String getPasswordResetToken() {
        return passwordResetToken;
    }
    public void setPasswordResetToken(String token) {
        this.passwordResetToken = token;
    }
    public LocalDateTime getPasswordResetTokenExpiry() {
        return passwordResetTokenExpiry;
    }
    public void setPasswordResetTokenExpiry(LocalDateTime expiry) {
        this.passwordResetTokenExpiry = expiry;
    }

    @Override
    public String toString() {
        return "User{" +
                "username='" + username + '\'' +
                ", displayName='" + displayName + '\'' +
                ", bio='" + bio + '\'' +
                ", email='" + email + '\'' +
                ", role=" + role +
                ", createdAt=" + createdAt +
                ", lastOnline=" + lastOnline +
                ", ingredients=" + ingredients +
                '}';
    }

}
