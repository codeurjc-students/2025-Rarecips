package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.Activity;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.Review;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private ActivityService activityService;

    public List<Review> getReviewsByRecipeId(Long recipeId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewRepository.findByRecipeIdWithPagination(recipeId, pageable);
    }

    public Review saveReview(Review review) {
        Recipe recipe = recipeRepository.findById(review.getRecipe().getId()).orElse(null);

        if (recipe == null) {
            throw new RuntimeException("Recipe not found");
        }

        if (review.getAuthor() != null && review.getAuthor().getUsername() != null) {
            boolean hasReview = reviewRepository.existsByRecipeIdAndAuthorUsername(
                recipe.getId(),
                review.getAuthor().getUsername()
            );

            if (hasReview) {
                throw new RuntimeException("You have already reviewed this recipe. Delete your existing review first.");
            }
        }

        review.setRecipe(recipe);
        Review savedReview = reviewRepository.save(review);

        activityService.logActivity(
            review.getAuthor().getUsername(),
            Activity.ActivityType.CREATE_REVIEW,
            review.getRecipe().getLabel(),
            "created review for recipe " + review.getRecipe().getLabel(),
            review.getRecipe().getId(),
            null
        );

        activityService.logReview(
            review.getAuthor().getUsername(),
            review.getRecipe().getId(),
            review.getRecipe().getLabel(),
            Math.round(review.getRating()),
            review.getComment(),
            null
        );

        // Recalculate and update rating
        List<Review> reviews = reviewRepository.findByRecipeId(recipe.getId());
        Float averageRating = reviews.stream()
                .collect(Collectors.averagingDouble(Review::getRating))
                .floatValue();
        recipe.setRating(averageRating);
        recipe.addReview(savedReview);
        recipeRepository.save(recipe);

        return savedReview;
    }

    public void deleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        Recipe recipe = review.getRecipe();
        reviewRepository.deleteById(reviewId);

        if (recipe != null) {
            List<Review> remainingReviews = reviewRepository.findByRecipeId(recipe.getId());
            if (remainingReviews.isEmpty()) {
                recipe.setRating(0.0f);
            } else {
                Float averageRating = remainingReviews.stream()
                        .collect(Collectors.averagingDouble(Review::getRating))
                        .floatValue();
                recipe.setRating(averageRating);
            }
            recipe.getReviews().remove(review);
            recipeRepository.save(recipe);
        }
    }

    public Review findById(Long reviewId) {
        return reviewRepository.findById(reviewId).orElseThrow(() -> new IllegalArgumentException("Review with ID not found"));
    }
}