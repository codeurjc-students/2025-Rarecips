package com.blasetvrtumi.rarecips.controller;

import com.blasetvrtumi.rarecips.entity.Review;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.service.ReviewService;
import com.blasetvrtumi.rarecips.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private UserService userService;

    @Operation(summary = "Submit a review for a recipe")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Review submitted successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Recipe not found")
    })
    @PutMapping
    public ResponseEntity<?> submitReview(@RequestBody Review review) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        if (username == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(403).body("You must be logged in to submit a review");
        }

        User user = userService.getUserByUsername(username);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        User userAuthor = this.userService.getUserByUsername(username);
        review.setAuthor(userAuthor);

        try {
            Review savedReview = reviewService.saveReview(review);
            return ResponseEntity.ok(savedReview);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "Get paged reviews for a recipe")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reviews retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "404", description = "Recipe not found")
    })
    @GetMapping
    public ResponseEntity<Map<String, Object>> getReviews(
            @RequestParam Long recipeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        List<Review> allReviews = reviewService.getReviewsByRecipeId(recipeId, page, size + 1);

        boolean hasMore = allReviews.size() > size;

        List<Review> reviews = hasMore ? allReviews.subList(0, size) : allReviews;

        Map<String, Object> response = new HashMap<>();
        response.put("reviews", reviews);
        response.put("hasMore", hasMore);
        response.put("page", page);
        response.put("size", size);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete a review")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Review deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Review not found"),
            @ApiResponse(responseCode = "403", description = "Unauthorized to delete this review")
    })
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId, Authentication authentication) {
        User user = userService.getUserByUsername(authentication.getName());
        Review review = reviewService.findById(reviewId);
        if (review.getAuthor().equals(authentication.getName()) || user.getRole().equals("ADMIN")) {
            reviewService.deleteReview(reviewId);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(403).body("You are not authorized to delete this review");
        }
    }

}
