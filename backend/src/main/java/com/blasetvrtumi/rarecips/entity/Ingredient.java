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
    private String description;

    @JsonView(BasicInfo.class)
    private String food;

    @JsonView(BasicInfo.class)
    private Float quantity;

    @JsonView(BasicInfo.class)
    private String measure;

    @JsonView(BasicInfo.class)
    private Float weight;

    public Ingredient() {
    }

    public Ingredient(String description, String food, Float quantity, String measure, Float weight) {
        this.description = description;
        this.food = food;
        this.quantity = quantity;
        this.measure = measure;
        this.weight = weight;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFood() {
        return food;
    }

    public void setFood(String food) {
        this.food = food;
    }

    public Float getQuantity() {
        return quantity;
    }

    public void setQuantity(Float quantity) {
        this.quantity = quantity;
    }

    public String getMeasure() {
        return measure;
    }

    public void setMeasure(String measure) {
        this.measure = measure;
    }

    public Float getWeight() {
        return weight;
    }

    public void setWeight(Float weight) {
        this.weight = weight;
    }
}
