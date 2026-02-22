package backend.e2e;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.service.RecipeService;
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

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@DirtiesContext
@org.springframework.test.context.ActiveProfiles("test")
public class APIRecipeControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecipeService recipeService;

    private User testUser;
    private Recipe testRecipe;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.basePath = "/api/v1";
        RestAssured.useRelaxedHTTPSValidation();

        testUser = new User("testuser", "testpassword", "test@example.com", null, "Test User", "Test description", "Test bio");
        userRepository.save(testUser);

        Authentication auth = new UsernamePasswordAuthenticationToken(testUser.getUsername(), testUser.getPassword());
        SecurityContextHolder.getContext().setAuthentication(auth);

        Map<String, Object> recipeData = new HashMap<>();
        recipeData.put("label", "Test Recipe");
        recipeData.put("description", "Test Description");
        recipeData.put("people", 4);
        recipeData.put("totalTime", 30.0f);
        recipeData.put("totalWeight", 500.0f);
        recipeData.put("calories", 400.0f);
        recipeData.put("difficulty", 1);

        testRecipe = recipeService.createRecipeFromMap(recipeData, testUser.getUsername());
    }

    @AfterEach
    public void tearDown() {
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
    public void testGetRecipeById() {
        given()
            .when()
            .get("/recipes/{id}", testRecipe.getId())
            .then()
            .log().all()
            .statusCode(200)
            .body("recipe.label", equalTo("Test Recipe"))
            .body("recipe.description", equalTo("Test Description"));
    }

    @Test
    public void testSearchRecipes() {
        given()
            .param("query", "Test")
            .param("page", 0)
            .param("size", 10)
            .when()
            .get("/recipes/search")
            .then()
            .log().all()
            .statusCode(200)
            .body("recipes", notNullValue())
            .body("total", greaterThanOrEqualTo(0));
    }

    @Test
    public void testCountRecipes() {
        given()
            .when()
            .get("/recipes/search/count")
            .then()
            .log().all()
            .statusCode(200)
            .body("count", greaterThanOrEqualTo(0));
    }

    @Test
    public void testFilterRecipes() {
        given()
            .param("page", 0)
            .param("size", 10)
            .param("sortBy", "updatedAt")
            .when()
            .get("/recipes/filter")
            .then()
            .log().all()
            .statusCode(200)
            .body("recipes", notNullValue())
            .body("total", greaterThanOrEqualTo(0));
    }

    @Test
    public void testFilterRecipesWithDifficulty() {
        given()
            .param("difficulties", 1)
            .param("page", 0)
            .param("size", 10)
            .when()
            .get("/recipes/filter")
            .then()
            .log().all()
            .statusCode(200)
            .body("recipes", notNullValue());
    }

    @Test
    public void testFilterRecipesWithRating() {
        given()
            .param("minRating", 0)
            .param("page", 0)
            .param("size", 10)
            .when()
            .get("/recipes/filter")
            .then()
            .log().all()
            .statusCode(200)
            .body("recipes", notNullValue());
    }

    @Test
    public void testFilterRecipesByMostPopular() {
        given()
            .param("sortBy", "mostPopular")
            .param("page", 0)
            .param("size", 10)
            .when()
            .get("/recipes/filter")
            .then()
            .log().all()
            .statusCode(200)
            .body("recipes", notNullValue());
    }

    @Test
    public void testFilterRecipesByAlphabetical() {
        given()
            .param("sortBy", "alphabetical")
            .param("page", 0)
            .param("size", 10)
            .when()
            .get("/recipes/filter")
            .then()
            .log().all()
            .statusCode(200)
            .body("recipes", notNullValue());
    }
}
