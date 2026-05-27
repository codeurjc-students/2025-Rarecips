package com.blasetvrtumi.rarecips.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ImageService {
    private static final Logger logger = LoggerFactory.getLogger(ImageService.class);

    private final MinioService minioService;

    public ImageService(MinioService minioService) {
        this.minioService = minioService;
    }



    public String localImageToUrl(String imagePath) {
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
                
                String contentType = "image/jpeg";
                if (imagePath.endsWith(".png")) contentType = "image/png";
                else if (imagePath.endsWith(".webp")) contentType = "image/webp";

                imageStream.close();
                buffer.close();

                return minioService.uploadBytes(imageBytes, contentType);
            } else {
                logger.warn("Image not found: {}", imagePath);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }



    public String localImageToString(String s) {
        return localImageToUrl(s);
    }
}
