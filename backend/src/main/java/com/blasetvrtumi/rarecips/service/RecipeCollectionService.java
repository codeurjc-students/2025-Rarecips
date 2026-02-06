package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.Activity;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.RecipeCollection;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.RecipeCollectionRepository;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class RecipeCollectionService {

    @Autowired
    private RecipeCollectionRepository recipeCollectionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private ActivityService activityService;

    public RecipeCollection save(RecipeCollection collection) {
        return recipeCollectionRepository.save(collection);
    }

    public Optional<RecipeCollection> findById(Long id) {
        return recipeCollectionRepository.findById(id);
    }

    public List<RecipeCollection> findByUsername(String username) {
        return recipeCollectionRepository.findByUserUsernameWithRecipes(username);
    }

    public Optional<RecipeCollection> getFavoritesCollection(String username) {
        return recipeCollectionRepository.findFirstByUserUsernameAndIsFavoritesTrue(username);
    }

    @Transactional
    public RecipeCollection createCollection(String username, String title, boolean isFavorites) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        if (recipeCollectionRepository.existsByUserAndTitle(user, title)) {
            throw new IllegalArgumentException("Collection with this title already exists");
        }

        RecipeCollection collection = new RecipeCollection(title, user, isFavorites);
        collection = recipeCollectionRepository.save(collection);

        activityService.logActivity(
                user.getUsername(),
                Activity.ActivityType.CREATE_COLLECTION,
                collection.getTitle(),
                "created collection " + collection.getTitle(),
                null,
                collection.getId()
        );

        return collection;
    }

    @Transactional
    public RecipeCollection getOrCreateFavoritesCollection(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        List<RecipeCollection> allFavorites = recipeCollectionRepository.findByUser(user).stream()
                .filter(RecipeCollection::isFavorites)
                .toList();

        if (allFavorites.isEmpty()) {
            RecipeCollection favorites = new RecipeCollection("Favorites", user, true);
            return recipeCollectionRepository.save(favorites);
        }

        if (allFavorites.size() > 1) {
            RecipeCollection keepFirst = allFavorites.get(0);
            for (int i = 1; i < allFavorites.size(); i++) {
                RecipeCollection duplicate = allFavorites.get(i);
                for (Recipe recipe : duplicate.getRecipes()) {
                    if (!keepFirst.getRecipes().contains(recipe)) {
                        keepFirst.addRecipe(recipe);
                    }
                }
                recipeCollectionRepository.delete(duplicate);
            }
            return recipeCollectionRepository.save(keepFirst);
        }

        return allFavorites.get(0);
    }

    @Transactional
    public RecipeCollection addRecipeToCollection(Long collectionId, Long recipeId) {
        RecipeCollection collection = recipeCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new IllegalArgumentException("Collection not found"));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));

        collection.setUpdatedAt(LocalDateTime.now());
        collection.addRecipe(recipe);
        return recipeCollectionRepository.save(collection);
    }

    @Transactional
    public RecipeCollection removeRecipeFromCollection(Long collectionId, Long recipeId) {
        RecipeCollection collection = recipeCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new IllegalArgumentException("Collection not found"));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));

        collection.removeRecipe(recipe);
        return recipeCollectionRepository.save(collection);
    }

    @Transactional
    public void deleteCollection(Long collectionId) {
        RecipeCollection collection = recipeCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new IllegalArgumentException("Collection not found"));

        if (collection.isFavorites()) {
            throw new IllegalArgumentException("Cannot delete favorites collection");
        }

        recipeCollectionRepository.delete(collection);
    }

    @Transactional
    public RecipeCollection updateCollectionTitle(Long collectionId, String newTitle) {
        RecipeCollection collection = recipeCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new IllegalArgumentException("Collection not found"));

        if (collection.isFavorites()) {
            throw new IllegalArgumentException("Cannot rename favorites collection");
        }

        if (recipeCollectionRepository.existsByUserAndTitle(collection.getUser(), newTitle)) {
            throw new IllegalArgumentException("Collection with this title already exists");
        }

        collection.setTitle(newTitle);
        return recipeCollectionRepository.save(collection);
    }

    public boolean isRecipeInCollection(Long collectionId, Long recipeId) {
        RecipeCollection collection = recipeCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new IllegalArgumentException("Collection not found"));

        return collection.getRecipes().stream()
                .anyMatch(recipe -> recipe.getId().equals(recipeId));
    }

    @Transactional(readOnly = true)
    public List<RecipeCollection> getPopularPublicCollections(int limit) {
        List<RecipeCollection> collections = recipeCollectionRepository.findAllNonFavoritesWithRecipes();
        return collections.stream()
                .filter(c -> !c.getRecipes().isEmpty())
                .sorted((a, b) -> Integer.compare(b.getRecipes().size(), a.getRecipes().size()))
                .limit(limit)
                .toList();
    }

    public List<RecipeCollection> searchCollections(String query) {
        List<RecipeCollection> collections = recipeCollectionRepository.findAllNonFavoritesWithRecipes();
        String lowerQuery = query.toLowerCase();
        return collections.stream()
                .filter(c -> c.getTitle().toLowerCase().contains(lowerQuery))
                .toList();
    }

    public Page<RecipeCollection> searchCollectionsPaged(String query, int page, int size, String sort, String direction) {
        String q = query == null ? "" : query.toLowerCase();
        String sortBy = (sort != null && !sort.isEmpty()) ? sort : "createdAt";
        Pageable pageable = PageRequest.of(page, size);
        if ("recipeCount".equals(sortBy)) {
            if (q.isEmpty()) {
                return recipeCollectionRepository.findAllNonFavoritesOrderByRecipeCountDesc(pageable);
            } else {
                return recipeCollectionRepository.searchNonFavoritesByTitleOrderByRecipeCountDesc(q, pageable);
            }
        }
        if ("title".equals(sortBy)) {
            if (q.isEmpty()) {
                return recipeCollectionRepository.findAllNonFavoritesOrderByTitleAsc(pageable);
            } else {
                return recipeCollectionRepository.searchNonFavoritesByTitleOrderByTitleAsc(q, pageable);
            }
        }
        Sort.Direction dir = (direction != null && direction.equalsIgnoreCase("asc")) ? Sort.Direction.ASC : Sort.Direction.DESC;
        pageable = PageRequest.of(page, size, Sort.by(dir, sortBy));
        if (q.isEmpty()) {
            return recipeCollectionRepository.findByIsFavoritesFalse(pageable);
        }
        return recipeCollectionRepository.searchNonFavoritesByTitle(q, pageable);
    }

    public Page<RecipeCollection> getNonFavoritesPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return recipeCollectionRepository.findByIsFavoritesFalse(pageable);
    }

    public RecipeCollection updateCollection(RecipeCollection collection) {
        return recipeCollectionRepository.save(collection);
    }
}
