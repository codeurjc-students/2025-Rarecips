package backend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import static org.assertj.core.api.Assertions.assertThat;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.entity.Review;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.service.ReviewService;
import com.blasetvrtumi.rarecips.service.UserService;
import com.blasetvrtumi.rarecips.service.RecipeService;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import java.util.ArrayList;

@SpringBootTest(classes = RarecipsApplication.class)
@ActiveProfiles("test")
@Transactional
public class ReviewServiceIntegrationTest {

    @Autowired
    private ReviewService reviewService;
    @Autowired
    private UserService userService;
    @Autowired
    private RecipeService recipeService;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void shouldCreateAndRetrieveReview() {
        User user = new User("testuser", "password", "test@example.com", null, "Test User", "desc", "bio");
        User savedUser = userService.save(user);
        Recipe recipe = new Recipe("Test Recipe", "desc", new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), 4, new ArrayList<>(), 1, new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), 30.0f, 500.0f, 400.0f, savedUser, new ArrayList<>());
        Recipe savedRecipe = recipeService.createRecipe(recipe, savedUser.getUsername());
        Review review = new Review(savedRecipe, savedUser, 5.0f, "Great!", null, null);
        Review savedReview = reviewService.saveReview(review);
        entityManager.flush();
        Review retrieved = reviewService.findById(savedReview.getId());
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getRating()).isEqualTo(5.0f);
    }
}
