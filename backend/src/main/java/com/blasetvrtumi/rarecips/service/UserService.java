package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.Review;
import com.blasetvrtumi.rarecips.entity.RecipeCollection;
import com.blasetvrtumi.rarecips.entity.Ingredient;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.ReviewRepository;
import com.blasetvrtumi.rarecips.repository.RecipeCollectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private RecipeCollectionRepository collectionRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User save(User user) {
        return userRepository.save(user);
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public String[] getAllUsernames() {
        return userRepository.findAll().stream()
                .map(User::getUsername)
                .toArray(String[]::new);
    }

    public String[] getAllEmails() {
        return userRepository.findAll().stream()
                .map(User::getEmail)
                .toArray(String[]::new);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public Page<Recipe> getUserRecipes(String username, Pageable pageable) {
        return recipeRepository.findByAuthorUsername(username, pageable);
    }

    public Page<Review> getUserReviews(String username, Pageable pageable) {
        return reviewRepository.findByAuthorUsername(username, pageable);
    }

    public Page<RecipeCollection> getUserCollections(String username, Pageable pageable, Authentication authentication) {
        if (authentication != null) {
            User user = this.findByUsername(authentication.getName());
            if (!username.equals(user.getUsername()) && !user.getRole().equals("ADMIN")) return collectionRepository.findByUserUsernameAndIsFavoritesFalse(username, pageable);
        } else {
            return collectionRepository.findByUserUsernameAndIsFavoritesFalse(username, pageable);
        }
        return collectionRepository.findByUserUsername(username, pageable);
    }

    public Page<Ingredient> getUserIngredientsPage(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return Page.empty(pageable);
        }

        List<Ingredient> allIngredients = user.getIngredients();
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allIngredients.size());

        List<Ingredient> pageContent = allIngredients.subList(start, end);
        return new PageImpl<>(pageContent, pageable, allIngredients.size());
    }

    public Page<User> filterUsers(String query, Integer minRecipes, Integer minReviews, Integer minCollections, String sortBy, String direction, int page, int size) {
        Pageable pageable;
        String sortField = ("username".equals(sortBy)) ? "username" : (sortBy == null || sortBy.isEmpty() ? "createdAt" : sortBy);
        Sort.Direction dir = (direction != null && direction.equalsIgnoreCase("asc")) ? Sort.Direction.ASC : Sort.Direction.DESC;
        pageable = PageRequest.of(page, size, Sort.by(dir, sortField));
        return userRepository.filterUsersWithCounts(
            query != null && !query.isEmpty() ? query : null,
            minRecipes,
            minReviews,
            minCollections,
            pageable
        );
    }

    public void deleteUserAndCascade(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) return;
        collectionRepository.deleteAll(collectionRepository.findByUser(user));
        recipeRepository.deleteAll(recipeRepository.findByAuthor(user));
        reviewRepository.deleteAll(reviewRepository.findByAuthor(user));
        user.setIngredients(new java.util.ArrayList<>());
        userRepository.save(user);
        userRepository.delete(user);
    }

    public boolean validatePassword(String password) {
        int score = 0;
        if (password == null) return false;
        if (password.length() > 8) score += 1;
        if (password.matches(".*[A-Z].*")) score += 1;
        if (password.matches(".*[a-z].*")) score += 1;
        if (password.matches(".*[0-9].*")) score += 1;
        if (password.matches(".*[^A-Za-z0-9].*")) score += 1;
        return (score >= 4);
    }

    public boolean checkPassword(String username, String rawPassword) {
        User user = userRepository.findByUsername(username);
        if (user == null) return false;
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    public void updatePassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username);
        if (user == null) return;
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User findByPasswordResetToken(String token) {
        return userRepository.findByPasswordResetToken(token);
    }
}
