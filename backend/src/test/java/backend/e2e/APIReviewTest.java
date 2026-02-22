package backend.e2e;

import com.blasetvrtumi.rarecips.entity.Review;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.repository.ReviewRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.RarecipsApplication;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@DirtiesContext
@org.springframework.test.context.ActiveProfiles("test")
public class APIReviewTest {

    @Autowired
    private ReviewRepository reviewRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RecipeRepository recipeRepository;

    @LocalServerPort
    private int port;

    private User testUser;
    private Recipe testRecipe;
    private Review testReview;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.basePath = "/api/v1";
        RestAssured.useRelaxedHTTPSValidation();

        testUser = new User("testuser", "password", "test@example.com", null, "Test User", "desc", "bio");
        userRepository.save(testUser);

        Authentication auth = new UsernamePasswordAuthenticationToken(testUser.getUsername(), testUser.getPassword());
        SecurityContextHolder.getContext().setAuthentication(auth);

        testRecipe = new Recipe("Test Recipe", "desc", new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), 4, new ArrayList<>(), 1, new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), 30.0f, 500.0f, 400.0f, testUser, new ArrayList<>());
        recipeRepository.save(testRecipe);
        testReview = new Review(testRecipe, testUser, 5.0f, "Great!", null, null);
        reviewRepository.save(testReview);
    }

    @AfterEach
    public void tearDown() {
        if (testReview != null && testReview.getId() != null) {
            reviewRepository.deleteById(testReview.getId());
        }
        if (testRecipe != null && testRecipe.getId() != null) {
            recipeRepository.deleteById(testRecipe.getId());
        }
        if (testUser != null && testUser.getUsername() != null) {
            User user = userRepository.findByUsername(testUser.getUsername());
            if (user != null) {
                userRepository.delete(user);
            }
        }

        SecurityContextHolder.clearContext();
    }

    @Test
    public void testGetReviewsByRecipeId() {
        given()
            .param("recipeId", testRecipe.getId())
            .param("page", 0)
            .param("size", 10)
            .when()
            .get("/reviews")
            .then()
            .log().all()
            .statusCode(200)
            .body("reviews.size()", greaterThan(0))
            .body("reviews[0].rating", equalTo(5.0f))
            .body("reviews[0].comment", equalTo("Great!"));
    }
}
