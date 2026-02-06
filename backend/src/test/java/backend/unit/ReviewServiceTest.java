package backend.unit;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

import java.util.Optional;
import java.util.ArrayList;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.blasetvrtumi.rarecips.entity.Review;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.ReviewRepository;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.service.ActivityService;
import com.blasetvrtumi.rarecips.service.ReviewService;

@ExtendWith(MockitoExtension.class)
public class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private RecipeRepository recipeRepository;
    @Mock
    private ActivityService activityService;
    @InjectMocks
    private ReviewService reviewService;

    @Test
    public void shouldCreateReviewSuccessfully() {
        User author = new User("testuser", "password", "test@example.com", null, "Test User", "desc", "bio");
        Recipe recipe = new Recipe("Test Recipe", "desc", new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), 4, new ArrayList<>(), 1, new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), 30.0f, 500.0f, 400.0f, author, new ArrayList<>());
        recipe.setId(1L);
        Review review = new Review(recipe, author, 5.0f, "Great!", null, null);
        when(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe));
        when(reviewRepository.existsByRecipeIdAndAuthorUsername(1L, author.getUsername())).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(review);
        when(reviewRepository.findByRecipeId(1L)).thenReturn(new ArrayList<>());
        Review result = reviewService.saveReview(review);
        assertThat(result.getRating()).isEqualTo(5.0f);
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    public void shouldFindReviewById() {
        Review review = new Review(null, null, 5.0f, "Great!", null, null);
        review.setId(1L);
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        Review result = reviewService.findById(1L);
        assertThat(result).isNotNull();
        assertThat(result.getRating()).isEqualTo(5.0f);
    }

    @Test
    public void shouldUpdateReviewSuccessfully() {
        User author = new User("testuser", "password", "test@example.com", null, "Test User", "desc", "bio");
        Recipe recipe = new Recipe("Test Recipe", "desc", new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), 4, new ArrayList<>(), 1, new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), 30.0f, 500.0f, 400.0f, author, new ArrayList<>());
        recipe.setId(1L);
        Review review = new Review(recipe, author, 5.0f, "Great!", null, null);
        review.setId(1L);
        review.setComment("Updated comment");
        review.setRating(4.0f);
        when(reviewRepository.save(any(Review.class))).thenReturn(review);
        Review result = reviewRepository.save(review);
        assertThat(result.getComment()).isEqualTo("Updated comment");
        assertThat(result.getRating()).isEqualTo(4.0f);
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    public void shouldDeleteReviewSuccessfully() {
        doNothing().when(reviewRepository).deleteById(1L);
        reviewRepository.deleteById(1L);
        verify(reviewRepository).deleteById(1L);
    }

    @Test
    public void shouldReturnEmptyWhenReviewNotFound() {
        when(reviewRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> reviewService.findById(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Review with ID not found");
    }
}
