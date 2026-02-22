package com.blasetvrtumi.rarecips.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.Base64;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ImageService {
    private static final Logger logger = LoggerFactory.getLogger(ImageService.class);

    public Blob updateImageFile(String imageString) {
        try {
            byte[] imageBytes = Base64.getDecoder().decode(imageString);
            Blob imageBlob = new javax.sql.rowset.serial.SerialBlob(imageBytes);
            return imageBlob;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public Blob localImageToBlob(String imagePath) {
        try {
            ClassPathResource imageResource = new ClassPathResource(imagePath);
            if (imageResource.exists()) {
                InputStream imageStream = imageResource.getInputStream();

                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                int bytesRead;
                byte[] data = new byte[8192];

                while ((bytesRead = imageStream.read(data, 0, data.length)) != -1) {
                    buffer.write(data, 0, bytesRead);
                }

                byte[] imageBytes = buffer.toByteArray();
                Blob imageBlob = new javax.sql.rowset.serial.SerialBlob(imageBytes);

                imageStream.close();
                buffer.close();
                return imageBlob;
            } else {
                logger.warn("Image not found: {}", imagePath);
            }
        } catch (IOException | SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public String blobToString(Blob blob) {
        if (blob == null) {
            return null;
        }
        try {
            byte[] bytes = blob.getBytes(1, (int) blob.length());
            String imageString = Base64.getEncoder().encodeToString(bytes);
            return imageString;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public String localImageToString(String s) {
        return blobToString(localImageToBlob(s));
    }
}
