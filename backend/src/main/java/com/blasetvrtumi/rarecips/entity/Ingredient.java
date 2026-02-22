package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;

@Entity
public class Ingredient {

    public interface BasicInfo {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonView(BasicInfo.class)
    private String food;

    @JsonView
    private String image;

    @JsonView
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imageString;

    public Ingredient() {
    }

    public Ingredient(String food, String image, String imageString) {
        this.food = food;
        this.image = image;
        this.imageString = imageString;
    }

    public Long getId() {
        return id;
    }

    public String getFood() {
        return food;
    }

    public void setFood(String food) {
        this.food = food;
    }

    public String getImageString() {
        return imageString;
    }

    public void setImageString(String imageString) {
        this.imageString = imageString;
    }
}
