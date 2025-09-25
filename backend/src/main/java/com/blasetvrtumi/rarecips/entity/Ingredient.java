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
    private Float quantity;

    @JsonView(BasicInfo.class)
    private String measure;

    @JsonView(BasicInfo.class)
    private Float weight;

    public Ingredient() {
    }

    public Ingredient(String description, Float quantity, String measure, Float weight) {
        this.description = description;
        this.quantity = quantity;
        this.measure = measure;
        this.weight = weight;
    }


}
