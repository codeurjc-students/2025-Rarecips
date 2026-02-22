package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.Activity;
import com.blasetvrtumi.rarecips.entity.ReviewStack;
import com.blasetvrtumi.rarecips.repository.ActivityRepository;
import com.blasetvrtumi.rarecips.repository.ReviewStackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ReviewStackRepository reviewStackRepository;

    public void logActivity(String username, Activity.ActivityType activityType, String recipeName, String description, Long recipeId, Long collectionId) {
        Activity activity = new Activity();
        activity.setUsername(username);
        activity.setActivityType(activityType.name());
        activity.setRecipeName(recipeName);
        activity.setDescription(description);
        activity.setRecipeId(recipeId);
        activity.setCollectionId(collectionId);
        activityRepository.save(activity);
    }

    public void logReview(String username, Long recipeId, String recipeName, int rating, String comment, String userImageString) {
        ReviewStack review = new ReviewStack();
        review.setUsername(username);
        review.setRecipeId(recipeId);
        review.setRecipeName(recipeName);
        review.setRating(rating);
        review.setComment(comment);
        review.setUserImageString(userImageString);
        reviewStackRepository.save(review);
    }

    public List<Activity> getLatestActivities(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return activityRepository.findLatestActivities(pageable);
    }

    public List<ReviewStack> getLatestReviews(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return reviewStackRepository.findLatestReviews(pageable);
    }
}

