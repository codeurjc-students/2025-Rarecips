package com.blasetvrtumi.rarecips.config;

import org.json.JSONArray;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class RecipeConfiguration {

    private static final Logger logger = LoggerFactory.getLogger(RecipeConfiguration.class);

    @Bean()
    public JSONArray recipes() {
        try {
            ClassPathResource resource = new ClassPathResource("static/assets/data/recipes.json");
            InputStream inputStream = resource.getInputStream();

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            int bytesRead;
            byte[] data = new byte[8192];

            while ((bytesRead = inputStream.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, bytesRead);
            }

            String content = buffer.toString();
            inputStream.close();
            buffer.close();

            return new JSONArray(content);
        } catch (IOException e) {
            logger.error("Failed to load recipes from classpath", e);
            return new JSONArray();
        }
    }
}
