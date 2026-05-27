package com.blasetvrtumi.rarecips.service;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Base64;
import java.util.UUID;

@Service
public class MinioService {
    private static final Logger logger = LoggerFactory.getLogger(MinioService.class);

    private final MinioClient minioClient;

    @Value("${minio.bucket.name}")
    private String bucketName;

    @Value("${minio.external.url}")
    private String minioUrl;

    public MinioService(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    public static String staticMinioUrl;

    @PostConstruct
    public void initBucket() {
        staticMinioUrl = this.minioUrl;
        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                String policy = "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Action\":[\"s3:GetObject\"],\"Effect\":\"Allow\",\"Principal\":\"*\",\"Resource\":[\"arn:aws:s3:::" + bucketName + "/*\"]}]}";
                minioClient.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(bucketName).config(policy).build());
                logger.info("Created MinIO bucket: {}", bucketName);
            }
            uploadDefaultImages();
        } catch (Exception e) {
            logger.error("Error initializing MinIO bucket", e);
        }
    }

    private void uploadDefaultImages() {
        String[] defaults = {"user.png", "recipe.png", "ingredient.png"};
        for (String def : defaults) {
            try {
                minioClient.statObject(io.minio.StatObjectArgs.builder().bucket(bucketName).object(def).build());
            } catch (Exception e) {
                try {
                    org.springframework.core.io.ClassPathResource resource = new org.springframework.core.io.ClassPathResource("static/assets/img/" + def);
                    if (resource.exists()) {
                        minioClient.putObject(io.minio.PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(def)
                                .stream(resource.getInputStream(), resource.contentLength(), -1)
                                .contentType("image/png")
                                .build());
                        logger.info("Uploaded default image to MinIO: {}", def);
                    }
                } catch (Exception ex) {
                    logger.error("Failed to upload default image: {}", def, ex);
                }
            }
        }
    }

    public String uploadBase64Image(String base64Image) {
        if (base64Image == null || base64Image.isEmpty()) return null;

        // Strip data:image/...;base64, prefix if present
        String contentType = "image/jpeg";
        if (base64Image.startsWith("data:")) {
            int commaIndex = base64Image.indexOf(',');
            if (commaIndex > 0) {
                String meta = base64Image.substring(0, commaIndex);
                if (meta.contains(";")) {
                    contentType = meta.substring(5, meta.indexOf(';'));
                }
                base64Image = base64Image.substring(commaIndex + 1);
            }
        }

        try {
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            return uploadBytes(imageBytes, contentType);
        } catch (IllegalArgumentException e) {
            logger.error("Failed to decode base64 image", e);
            if (base64Image.startsWith("http")) return base64Image;
            return null;
        }
    }

    public String uploadBytes(byte[] imageBytes, String contentType) {
        if (imageBytes == null || imageBytes.length == 0) return null;

        String extension = "jpg";
        if (contentType.contains("png")) extension = "png";
        else if (contentType.contains("webp")) extension = "webp";
        else if (contentType.contains("gif")) extension = "gif";

        String fileName = UUID.randomUUID().toString() + "." + extension;

        try (InputStream bais = new ByteArrayInputStream(imageBytes)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(bais, imageBytes.length, -1)
                            .contentType(contentType)
                            .build()
            );
            return getPublicUrl(fileName);
        } catch (Exception e) {
            logger.error("Failed to upload image to MinIO", e);
            return null;
        }
    }

    public String getPublicUrl(String fileName) {
        if (fileName == null) return null;
        if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
            return sanitizeUrl(fileName);
        }
        String baseUrl = minioUrl;
        if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        return baseUrl + "/" + bucketName + "/" + fileName;
    }

    public String sanitizeUrl(String url) {
        if (url == null) return null;
        if (url.contains("localhost:9000")) {
            return url.replace("http://localhost:9000", minioUrl);
        }
        if (url.contains("rarecips-minio:9000")) {
            return url.replace("http://rarecips-minio:9000", minioUrl);
        }
        return url;
    }
}
