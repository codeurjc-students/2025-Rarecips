package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Ingredient {

    public interface BasicInfo {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @org.hibernate.annotations.CreationTimestamp
    private LocalDateTime createdAt;

    @JsonView(BasicInfo.class)
    private String food;

    @JsonView
    private String image;



    @JsonView
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    public Ingredient() {
    }

    public Ingredient(String food, String image, String imageUrl) {
        this.food = food;
        this.image = image;
        this.imageUrl = imageUrl;
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

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }



    public String getImageUrl() {
        if (imageUrl == null) return null;
        String externalUrl = com.blasetvrtumi.rarecips.service.MinioService.staticMinioUrl;
        if (externalUrl != null && !externalUrl.isEmpty()) {
            if (externalUrl.endsWith("/")) {
                externalUrl = externalUrl.substring(0, externalUrl.length() - 1);
            }
            if (imageUrl.contains("localhost:9000")) {
                return imageUrl.replace("http://localhost:9000", externalUrl);
            }
            if (imageUrl.contains("rarecips-minio:9000")) {
                return imageUrl.replace("http://rarecips-minio:9000", externalUrl);
            }
        }
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    @PostLoad
    public void sanitizeImageUrlAfterLoad() {
        String externalUrl = com.blasetvrtumi.rarecips.service.MinioService.staticMinioUrl;
        if (externalUrl != null && !externalUrl.isEmpty() && this.imageUrl != null) {
            if (externalUrl.endsWith("/")) {
                externalUrl = externalUrl.substring(0, externalUrl.length() - 1);
            }
            if (this.imageUrl.contains("localhost:9000")) {
                this.imageUrl = this.imageUrl.replace("http://localhost:9000", externalUrl);
            } else if (this.imageUrl.contains("rarecips-minio:9000")) {
                this.imageUrl = this.imageUrl.replace("http://rarecips-minio:9000", externalUrl);
            }
        }
    }
}
