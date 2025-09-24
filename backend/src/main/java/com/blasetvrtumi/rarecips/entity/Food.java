package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;

import javax.sql.rowset.serial.SerialBlob;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.sql.Blob;
import java.sql.SQLException;

@Entity
public class Food {

    public interface BasicInfo {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonView(BasicInfo.class)
    private String name;

    @JsonView(Ingredient.BasicInfo.class)
    private String category;

    @JsonView(Ingredient.BasicInfo.class)
    private String imageUrl;

    @Lob
    @JsonView(Ingredient.BasicInfo.class)
    private String imageFile;

    public Blob URLtoBlob(String webURL) {
        try {
            URL url = new URL(webURL);
            InputStream in = url.openStream();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            // Read the image data into a byte array
            byte[] buffer = new byte[1024];
            int length;
            while ((length = in.read(buffer)) != -1) {
                baos.write(buffer, 0, length);
            }
            in.close();
            // Convert the ByteArrayOutputStream to a byte array
            byte[] imageBytes = baos.toByteArray();
            Blob imageBlob = new SerialBlob(imageBytes);
            return imageBlob;
        } catch (IOException | SQLException e) {
            return null;
        }
    }

    public Food() {
    }

    public Food(String name, String category, String imageUrl) {
        this.name = name;
        this.category = category;
        this.imageUrl = imageUrl;
        if (imageUrl != null && !imageUrl.isEmpty()) {
            Blob imageBlob = URLtoBlob(imageUrl);
            if (imageBlob != null) {
                try {
                    this.imageFile = imageBlob.getBinaryStream().toString();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
