package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.HealthReport;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.HealthReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import com.blasetvrtumi.rarecips.entity.RecipeCollection;
import com.blasetvrtumi.rarecips.repository.RecipeCollectionRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class HealthReportService {
    
    private final HealthReportRepository healthReportRepository;
    private final RecipeCollectionRepository recipeCollectionRepository;
    private final RestTemplate restTemplate;

    @Value("${app.ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    public HealthReportService(HealthReportRepository healthReportRepository, RecipeCollectionRepository recipeCollectionRepository) {
        this.healthReportRepository = healthReportRepository;
        this.recipeCollectionRepository = recipeCollectionRepository;
        this.restTemplate = new RestTemplate();
    }

    public List<HealthReport> getUserReports(User user) {
        return healthReportRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional
    public HealthReport generateReport(User user, String lang) {
        
        LocalDateTime startOfMonth = LocalDateTime.now()
            .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        int monthlyGenerations = healthReportRepository.countByUserAndCreatedAtAfter(user, startOfMonth);
        
        if (monthlyGenerations >= 5) {
            throw new IllegalStateException("health_report_limit_reached");
        }

        List<Recipe> favoriteRecipes = null;
        Optional<RecipeCollection> favCollectionOpt = recipeCollectionRepository.findFirstByUserUsernameAndIsFavoritesTrue(user.getUsername());
        if (favCollectionOpt.isPresent()) {
            favoriteRecipes = favCollectionOpt.get().getRecipes();
        }
        
        int count = 0;
        float totalCalories = 0;
        float totalWeight = 0;
        float totalTime = 0;
        float totalDifficulty = 0;
        float totalPeople = 0;
        Map<String, Integer> dietLabelsCount = new HashMap<>();
        Map<String, Integer> healthLabelsCount = new HashMap<>();
        Map<String, Integer> cautionsCount = new HashMap<>();
        
        if(favoriteRecipes != null) {
            count = favoriteRecipes.size();
            for (Recipe r : favoriteRecipes) {
                if (r.getCalories() != null) totalCalories += r.getCalories();
                if (r.getTotalWeight() != null) totalWeight += r.getTotalWeight();
                if (r.getTotalTime() != null) totalTime += r.getTotalTime();
                totalDifficulty += r.getDifficulty();
                if (r.getPeople() != null) totalPeople += r.getPeople();

                if (r.getDietLabels() != null) {
                    for (String label : r.getDietLabels()) {
                        dietLabelsCount.put(label, dietLabelsCount.getOrDefault(label, 0) + 1);
                    }
                }
                if (r.getHealthLabels() != null) {
                    for (String label : r.getHealthLabels()) {
                        healthLabelsCount.put(label, healthLabelsCount.getOrDefault(label, 0) + 1);
                    }
                }
                if (r.getCautions() != null) {
                    for (String label : r.getCautions()) {
                        cautionsCount.put(label, cautionsCount.getOrDefault(label, 0) + 1);
                    }
                }
            }
        }

        float averageCalories = count > 0 ? totalCalories / count : 0;
        float averageDifficulty = count > 0 ? totalDifficulty / count : 0;
        float averagePeople = count > 0 ? totalPeople / count : 0;

        String langName = switch(lang.toLowerCase()) {
            case "es" -> "Spanish";
            case "en" -> "English";
            case "fr" -> "French";
            case "ja" -> "Japanese";
            case "zh" -> "Chinese";
            default -> lang;
        };

        String prompt = "Tengo " + count + " recetas guardadas en mi lista de favoritos. " +
            "La suma total de calorias de estas recetas es " + totalCalories + " kcal. " +
            "Etiquetas de dieta mas frecuentes: " + getTopLabels(dietLabelsCount) + ". " +
            "Etiquetas de salud mas frecuentes: " + getTopLabels(healthLabelsCount) + ". " +
            "Precauciones mas frecuentes: " + getTopLabels(cautionsCount) + ". " +
            "Actúa como mi asesor nutricional y dirígete directamente a mí en segunda persona ('Tienes " + count + " recetas...', 'Para mejorar tu dieta deberías...'). " +
            "Analiza mis datos y redáctame un breve reporte de salud motivacional (max 3 parrafos) dando un buen consejo general personalizado en base a mis recetas favoritas. " +
            "No incluyas saludos, introducciones largas ni traducciones extra. \n" +
            "CRITICAL INSTRUCTION: You MUST translate and write your entire response exclusively in " + langName + ". Do not use any other language.";
            
        String summary = "";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> body = new HashMap<>();
            body.put("model", "llama3.2:1b");
            body.put("prompt", prompt);
            body.put("stream", false);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(ollamaUrl + "/api/generate", request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                summary = (String) response.getBody().get("response");
            } else {
                summary = "Health report couldn't be generated: " + response.getStatusCode();
            }
        } catch(Exception e) {
            summary = "Ollama communication error: " + e.getMessage();
        }

        HealthReport report = new HealthReport(
            user,
            summary,
            totalCalories,
            totalWeight,
            totalTime,
            averageCalories,
            averageDifficulty,
            averagePeople,
            count,
            new HashMap<>(dietLabelsCount),
            new HashMap<>(healthLabelsCount),
            new HashMap<>(cautionsCount)
        );
        return healthReportRepository.save(report);
    }

    public HealthReport computeAggregates(User user) {
        List<Recipe> favoriteRecipes = null;
        Optional<RecipeCollection> favCollectionOpt = recipeCollectionRepository.findFirstByUserUsernameAndIsFavoritesTrue(user.getUsername());
        if (favCollectionOpt.isPresent()) {
            favoriteRecipes = favCollectionOpt.get().getRecipes();
        }

        int count = 0;
        float totalCalories = 0;
        float totalWeight = 0;
        float totalTime = 0;
        float totalDifficulty = 0;
        float totalPeople = 0;
        Map<String, Integer> dietLabelsCount = new HashMap<>();
        Map<String, Integer> healthLabelsCount = new HashMap<>();
        Map<String, Integer> cautionsCount = new HashMap<>();

        if (favoriteRecipes != null) {
            count = favoriteRecipes.size();
            for (Recipe r : favoriteRecipes) {
                if (r.getCalories() != null) totalCalories += r.getCalories();
                if (r.getTotalWeight() != null) totalWeight += r.getTotalWeight();
                if (r.getTotalTime() != null) totalTime += r.getTotalTime();
                totalDifficulty += r.getDifficulty();
                if (r.getPeople() != null) totalPeople += r.getPeople();

                if (r.getDietLabels() != null) {
                    for (String label : r.getDietLabels()) {
                        dietLabelsCount.put(label, dietLabelsCount.getOrDefault(label, 0) + 1);
                    }
                }
                if (r.getHealthLabels() != null) {
                    for (String label : r.getHealthLabels()) {
                        healthLabelsCount.put(label, healthLabelsCount.getOrDefault(label, 0) + 1);
                    }
                }
                if (r.getCautions() != null) {
                    for (String label : r.getCautions()) {
                        cautionsCount.put(label, cautionsCount.getOrDefault(label, 0) + 1);
                    }
                }
            }
        }

        float averageCalories = count > 0 ? totalCalories / count : 0;
        float averageDifficulty = count > 0 ? totalDifficulty / count : 0;
        float averagePeople = count > 0 ? totalPeople / count : 0;

        HealthReport report = new HealthReport(
            user,
            "",
            totalCalories,
            totalWeight,
            totalTime,
            averageCalories,
            averageDifficulty,
            averagePeople,
            count,
            new HashMap<>(dietLabelsCount),
            new HashMap<>(healthLabelsCount),
            new HashMap<>(cautionsCount)
        );

        return report;
    }
    
    private String getTopLabels(Map<String, Integer> map) {
        if (map.isEmpty()) return "None";
        List<Map.Entry<String, Integer>> list = new ArrayList<>(map.entrySet());
        list.sort((a, b) -> b.getValue().compareTo(a.getValue()));
        
        List<String> topList = new ArrayList<>();
        for(int i=0; i<Math.min(3, list.size()); i++) {
            topList.add(list.get(i).getKey());
        }
        return String.join(", ", topList);
    }
}
