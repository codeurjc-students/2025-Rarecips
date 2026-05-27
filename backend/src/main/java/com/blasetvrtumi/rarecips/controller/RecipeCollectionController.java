package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.RecipeCollection;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.service.RecipeCollectionService;
import com.blasetvrtumi.rarecips.service.UserService;
import com.blasetvrtumi.rarecips.service.NotificationService;
import com.blasetvrtumi.rarecips.service.RecipeService;
import com.blasetvrtumi.rarecips.entity.Notification;
import com.fasterxml.jackson.annotation.JsonView;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/collections")
public class RecipeCollectionController {

    @Autowired
    private RecipeCollectionService collectionService;
    @Autowired
    private UserService userService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private RecipeService recipeService;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return userService.findByUsername(authentication.getName());
    }

    private boolean canViewRecipe(Recipe recipe, User authenticatedUser) {
        if (!recipe.isPendingReview()) {
            return true;
        }
        if (authenticatedUser == null) {
            return false;
        }
        if ("ADMIN".equals(authenticatedUser.getRole())) {
            return true;
        }
        return recipe.getAuthor() != null && recipe.getAuthor().equals(authenticatedUser.getUsername());
    }

    private RecipeCollection sanitizeCollectionForViewer(RecipeCollection source, User authenticatedUser) {
        RecipeCollection safe = new RecipeCollection();
        safe.setId(source.getId());
        safe.setTitle(source.getTitle());
        safe.setFavorites(source.isFavorites());
        safe.setUser(source.getUser());
        safe.setCreatedAt(source.getCreatedAt());
        safe.setUpdatedAt(source.getUpdatedAt());
        safe.setRecipes(source.getRecipes().stream()
                .filter(recipe -> canViewRecipe(recipe, authenticatedUser))
                .collect(Collectors.toList()));
        return safe;
    }

    @Operation(summary = "Get popular public collections")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Popular collections retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request", content = @Content)
    })
    @GetMapping("/public/popular")
    @JsonView(RecipeCollection.BasicInfo.class)
    public ResponseEntity<List<RecipeCollection>> getPopularPublicCollections(
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        List<RecipeCollection> collections = collectionService.getPopularPublicCollections(limit);
        User authenticatedUser = getAuthenticatedUser(authentication);
        List<RecipeCollection> safeCollections = collections.stream()
                .map(collection -> sanitizeCollectionForViewer(collection, authenticatedUser))
                .toList();
        return ResponseEntity.ok(safeCollections);
    }

    @Operation(summary = "Get favorites collection for own user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Favorites collection retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/liked")
    public ResponseEntity<RecipeCollection> getFavoritesCollection(@RequestParam String username, Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        if (authentication.getName().equals(username) || user.getRole().equals("ADMIN")) {
            try {
                RecipeCollection favorites = collectionService.getOrCreateFavoritesCollection(username);
                RecipeCollection safeFavorites = sanitizeCollectionForViewer(favorites, user);
                return ResponseEntity.ok(safeFavorites);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @Operation(summary = "Get all collections for a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Collections retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping
    @JsonView(RecipeCollection.BasicInfo.class)
    public ResponseEntity<List<RecipeCollection>> getUserCollections(@RequestParam String username, Authentication authentication) {
        List<RecipeCollection> collections = collectionService.findByUsername(username);
        Map<Long, RecipeCollection> uniqueCollections = new HashMap<>();
        User authenticatedUser = getAuthenticatedUser(authentication);
        boolean isOwner = authentication != null && authentication.getName().equals(username);
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMIN"));
        for (RecipeCollection c : collections) {
            if (c.isFavorites()) {
                if (isOwner || isAdmin) {
                    uniqueCollections.put(c.getId(), sanitizeCollectionForViewer(c, authenticatedUser));
                }
            } else {
                uniqueCollections.put(c.getId(), sanitizeCollectionForViewer(c, authenticatedUser));
            }
        }
        return ResponseEntity.ok(new ArrayList<>(uniqueCollections.values()));
    }

    @Operation(summary = "Get collection by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Collection retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Collection not found")
    })
    @GetMapping("/{id}")
    @JsonView(RecipeCollection.BasicInfo.class)
    public ResponseEntity<RecipeCollection> getCollectionById(@PathVariable Long id, Authentication authentication) {
        User authenticatedUser = getAuthenticatedUser(authentication);
        return collectionService.findById(id)
                .map(collection -> ResponseEntity.ok(sanitizeCollectionForViewer(collection, authenticatedUser)))
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Create a new collection")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Collection created successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PutMapping
    @JsonView(RecipeCollection.BasicInfo.class)
    public ResponseEntity<?> createCollection(
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = this.userService.findByUsername(username);
            String title = payload.get("title");

            if (title == null || title.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Title cannot be empty");
            }

            if (user.getRole().equals("ADMIN") && payload.get("username") != null) {
                username = payload.get("username");
                RecipeCollection collection = collectionService.createCollection(username, title, false);

                URI location = ServletUriComponentsBuilder
                    .fromCurrentContextPath()
                    .path("/api/v1/collections/{id}")
                    .buildAndExpand(collection.getId())
                    .toUri();

                return ResponseEntity.status(HttpStatus.CREATED).header("Location", location.toString()).body(collection);
            } else if (!authentication.isAuthenticated() && !user.getRole().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in to create collections");
            }

            RecipeCollection collection = collectionService.createCollection(username, title, false);

            URI location = ServletUriComponentsBuilder
                .fromCurrentContextPath()
                .path("/api/v1/collections/{id}")
                .buildAndExpand(collection.getId())
                .toUri();

            return ResponseEntity.status(HttpStatus.CREATED).header("Location", location.toString()).body(collection);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Add recipe to favorites")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Recipe added to favorites successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Recipe not found")
    })
    @PutMapping("/liked")
    @JsonView(RecipeCollection.BasicInfo.class)
    public ResponseEntity<?> addRecipeToFavorites(
            @RequestParam Long recipeId,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        try {
            if (!authentication.isAuthenticated()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in to modify favorites");

            String username = authentication.getName();
            User user = this.userService.findByUsername(username);
            if (payload.get("username") != null && user.getRole().equals("ADMIN")) username = payload.get("username");

            RecipeCollection favorites = collectionService.getOrCreateFavoritesCollection(username);
            RecipeCollection updated = collectionService.addRecipeToCollection(favorites.getId(), recipeId, user);
            
            Recipe recipe = recipeService.findById(recipeId);
            if (recipe != null && recipe.getAuthorUser() != null && !recipe.getAuthorUser().getUsername().equals(username) && notificationService != null) {
                String senderName = user.getDisplayName() != null && !user.getDisplayName().isBlank() ? user.getDisplayName() : user.getUsername();
                String recipeTitle = recipe.getLabel() != null ? recipe.getLabel() : "";
                notificationService.createAndSendNotificationWithTemplate(
                        recipe.getAuthorUser(),
                        user,
                        Notification.NotificationType.LIKED_RECIPE,
                        Map.of("user", senderName, "recipe", recipeTitle),
                        "notification.liked_recipe",
                        recipe.getId()
                );
            }
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Modify collection: add/remove recipe (recipeId query param), update title (title in body)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Collection modified successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Collection or recipe not found")
    })
    @PutMapping("/{id}")
    @JsonView(RecipeCollection.BasicInfo.class)
    public ResponseEntity<?> modifyCollection(
            @PathVariable Long id,
            @RequestParam(required = false) Long recipeId,
            @RequestParam(required = false, defaultValue = "false") boolean remove,
            @RequestBody(required = false) Map<String, String> payload,
            Authentication authentication) {
        try {
            RecipeCollection recipeCollection = getCollectionById(id, authentication).getBody();

            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in to modify collections");
            }

            if (recipeCollection == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Collection not found");
            }

            User user = this.userService.findByUsername(authentication.getName());

            if (recipeCollection.getUser() == null || !authentication.getName().equals(recipeCollection.getUser().getUsername()) && !user.getRole().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You are not authorized to modify this collection");
            }

            if (recipeId != null) {
                RecipeCollection collection;
                if (remove) {
                    collection = collectionService.removeRecipeFromCollection(id, recipeId);
                } else {
                    collection = collectionService.addRecipeToCollection(id, recipeId, user);
                    
                    Recipe recipe = recipeService.findById(recipeId);
                    if (recipe != null && recipe.getAuthorUser() != null && !recipe.getAuthorUser().getUsername().equals(user.getUsername()) && notificationService != null) {
                        Notification.NotificationType notifType = collection.isFavorites() ? Notification.NotificationType.LIKED_RECIPE : Notification.NotificationType.ADDED_TO_COLLECTION;

                        String senderName = user.getDisplayName() != null && !user.getDisplayName().isBlank() ? user.getDisplayName() : user.getUsername();
                        String recipeTitle = recipe.getLabel() != null ? recipe.getLabel() : "";
                        if (notifType == Notification.NotificationType.LIKED_RECIPE) {
                            notificationService.createAndSendNotificationWithTemplate(
                                    recipe.getAuthorUser(),
                                    user,
                                    notifType,
                                    Map.of("user", senderName, "recipe", recipeTitle),
                                    "notification.liked_recipe",
                                    recipe.getId()
                            );
                        } else {
                            notificationService.createAndSendNotificationWithTemplate(
                                    recipe.getAuthorUser(),
                                    user,
                                    notifType,
                                    Map.of("user", senderName, "recipe", recipeTitle, "collection", ""),
                                    "notification.added_to_collection",
                                    recipe.getId()
                            );
                        }
                    }
                }

                URI location = ServletUriComponentsBuilder
                    .fromCurrentContextPath()
                    .path("/api/v1/collections/{id}")
                    .buildAndExpand(collection.getId())
                    .toUri();

                return ResponseEntity.ok().header("Location", location.toString()).body(collection);
            }

            if (payload != null && payload.containsKey("title")) {
                String newTitle = payload.get("title");
                if (newTitle == null || newTitle.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("Title cannot be empty");
                }
                RecipeCollection collection = collectionService.updateCollectionTitle(id, newTitle);

                URI location = ServletUriComponentsBuilder
                    .fromCurrentContextPath()
                    .path("/api/v1/collections/{id}")
                    .buildAndExpand(collection.getId())
                    .toUri();

                return ResponseEntity.ok().header("Location", location.toString()).body(collection);
            }

            return ResponseEntity.badRequest().body("Missing recipeId (query param) or title (body)");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Delete collection")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Collection deleted successfully"),
            @ApiResponse(responseCode = "400", description = "Cannot delete favorites collection"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Collection not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCollection(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in to delete collections");
            }

            RecipeCollection recipeCollection = getCollectionById(id, authentication).getBody();
            if (recipeCollection == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Collection not found");
            }

            User user = this.userService.findByUsername(authentication.getName());

            if (recipeCollection.getUser() == null || !authentication.getName().equals(recipeCollection.getUser().getUsername()) && !user.getRole().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You are not authorized to delete this collection");
            }

            collectionService.deleteCollection(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Search collections by query")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Collections retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request", content = @Content),
            @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content)
    })
    @GetMapping("/search")
    @JsonView(RecipeCollection.BasicInfo.class)
    public ResponseEntity<Map<String, Object>> searchCollections(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String direction,
            Authentication authentication) {
        if (page < 0 || size <= 0) {
            return ResponseEntity.badRequest().build();
        }

        var result = collectionService.searchCollectionsPaged(q, page, size, sort, direction);
        User authenticatedUser = getAuthenticatedUser(authentication);
        List<RecipeCollection> safeCollections = result.getContent().stream()
                .map(collection -> sanitizeCollectionForViewer(collection, authenticatedUser))
                .toList();
        Map<String, Object> body = new HashMap<>();
        body.put("content", safeCollections);
        body.put("total", result.getTotalElements());
        body.put("last", result.isLast());

        return ResponseEntity.ok(body);
    }
}
