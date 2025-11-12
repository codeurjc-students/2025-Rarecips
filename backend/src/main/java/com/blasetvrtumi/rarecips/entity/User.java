package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Id;

import java.sql.Blob;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
public class User {

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

    @Lob
    @JsonIgnore
    private Blob profileImageFile;

    @JsonView(BasicInfo.class)
    private String profileImageString;

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
    @JsonView(Recipes.class)
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL)
    private List<Recipe> recipes = new ArrayList<>();

    // Reviews a user has made
    @JsonView(Reviews.class)
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL)
    private Set<Review> reviews = new HashSet<>();

    // Recipes a user has saved
    @ManyToMany
    @JoinTable(name = "user_saved_recipes",
            joinColumns = @JoinColumn(name = "username"),
            inverseJoinColumns = @JoinColumn(name = "recipe_id"))
    private List<Recipe> savedRecipes = new ArrayList<>();
    
    public enum Role {
        USER, ADMIN
    }

    public User() {
    }

    public User(String username, String displayName, String bio, Blob profileImageFile, String profileImageString, String email, String password) {
        this.username = username;
        this.displayName = displayName;
        this.bio = bio;
        this.profileImageFile = profileImageFile;
        this.profileImageString = profileImageString;
        this.email = email;
        this.password = password;
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

    public void setUsername(String username) {
        this.username = username;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public void setPassword(String password) {
        this.password = password;
    }

}
