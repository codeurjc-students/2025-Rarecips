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

    public Ingredient() {
    }

    public Ingredient(String food, String image) {
        this.food = food;
        this.image = image;
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

}
