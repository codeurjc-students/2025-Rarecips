package com.blasetvrtumi.rarecips.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

@Entity
public class Report {

    @ManyToOne
    private User user;

    @Id
    private Long id;

    private String details;
}
