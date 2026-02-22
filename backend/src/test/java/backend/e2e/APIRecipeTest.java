package backend.e2e;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.service.RecipeService;
import io.restassured.RestAssured;
import io.restassured.path.json.JsonPath;

import org.junit.jupiter.api.Assertions;
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

import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@DirtiesContext
@org.springframework.test.context.ActiveProfiles("test")
public class APIRecipeTest {

    @LocalServerPort
    private int port;

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecipeService recipeService;

    private final User testUser = new User("testuser", "testpassword", "test@example.com", null, "Test User",
            "This is a test user.", "");

    private Recipe testRecipe1;
    private Recipe testRecipe2;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.basePath = "/api/v1";
        RestAssured.useRelaxedHTTPSValidation();

        userRepository.save(testUser);

        Authentication auth = new UsernamePasswordAuthenticationToken(testUser.getUsername(), testUser.getPassword());
        SecurityContextHolder.getContext().setAuthentication(auth);

        Map<String, Object> recipe1Data = new HashMap<>();
        recipe1Data.put("label", "Spaghetti Bolognese");
        recipe1Data.put("description", "Classic Italian pasta");
        recipe1Data.put("people", 4);
        recipe1Data.put("totalTime", 45.0f);
        recipe1Data.put("totalWeight", 500.0f);
        recipe1Data.put("calories", 650.0f);
        recipe1Data.put("difficulty", 1);

        Map<String, Object> recipe2Data = new HashMap<>();
        recipe2Data.put("label", "Chicken Curry");
        recipe2Data.put("description", "Spicy Indian curry");
        recipe2Data.put("people", 4);
        recipe2Data.put("totalTime", 30.0f);
        recipe2Data.put("totalWeight", 600.0f);
        recipe2Data.put("calories", 520.0f);
        recipe2Data.put("difficulty", 1);

        testRecipe1 = recipeService.createRecipeFromMap(recipe1Data, testUser.getUsername());
        testRecipe2 = recipeService.createRecipeFromMap(recipe2Data, testUser.getUsername());
    }

    @AfterEach
    public void tearDown() {
        if (testRecipe1 != null && testRecipe1.getId() != null) {
            recipeRepository.deleteById(testRecipe1.getId());
        }
        if (testRecipe2 != null && testRecipe2.getId() != null) {
            recipeRepository.deleteById(testRecipe2.getId());
        }

        User user = userRepository.findByUsername(testUser.getUsername());
        if (user != null) {
            userRepository.delete(user);
        }

        SecurityContextHolder.clearContext();
    }

    @Test
    public void testGetRecipesList() {
        RestAssured
                .given()
                .log().all()
                .param("order", "lastmod")
                .param("size", 4)
                .param("page", 0)
                .when()
                .log().all()
                .get("/recipes")
                .then()
                .log().all()
                .statusCode(200)
                .body("recipes", notNullValue())
                .body("total", greaterThan(0));
    }

    @Test
    public void testGetRecipeByIdEndpoint() {
        long recipeId = testRecipe1.getId();

        RestAssured
                .given()
                .when()
                .get("/recipes/{id}", recipeId)
                .then()
                .log().all()
                .statusCode(200)
                .body("recipe.label", equalTo(testRecipe1.getLabel()))
                .body("recipe.description", equalTo(testRecipe1.getDescription()));
    }

    @Test
    public void testAssertRetrievedRecipeData() {
        long recipe1Id = testRecipe1.getId();
        long recipe2Id = testRecipe2.getId();

        final JsonPath response1 = RestAssured
                .given()
                .when()
                .get("/recipes/{id}", recipe1Id)
                .then()
                .log().all()
                .statusCode(200)
                .extract()
                .jsonPath();

        final JsonPath response2 = RestAssured
                .given()
                .when()
                .get("/recipes/{id}", recipe2Id)
                .then()
                .log().all()
                .statusCode(200)
                .extract()
                .jsonPath();


        Assertions.assertAll(
                () -> Assertions.assertEquals(testRecipe1.getLabel(), response1.getString("recipe.label")),
                () -> Assertions.assertEquals(testRecipe1.getDescription(), response1.getString("recipe.description")),
                () -> Assertions.assertEquals(testRecipe1.getPeople(), response1.getInt("recipe.people")),
                () -> Assertions.assertEquals(testRecipe1.getTotalTime(), response1.getFloat("recipe.totalTime")),
                () -> Assertions.assertEquals(testRecipe1.getTotalWeight(), response1.getFloat("recipe.totalWeight")),
                () -> Assertions.assertEquals(testUser.getUsername(), response1.getString("recipe.author")),
                () -> Assertions.assertEquals(testRecipe1.getCalories(), response1.getFloat("recipe.calories")),
                () -> Assertions.assertEquals(testRecipe2.getLabel(), response2.getString("recipe.label")),
                () -> Assertions.assertEquals(testRecipe2.getDescription(), response2.getString("recipe.description")),
                () -> Assertions.assertEquals(testRecipe2.getPeople(), response2.getInt("recipe.people")),
                () -> Assertions.assertEquals(testRecipe2.getTotalTime(), response2.getFloat("recipe.totalTime")),
                () -> Assertions.assertEquals(testRecipe2.getTotalWeight(), response2.getFloat("recipe.totalWeight")),
                () -> Assertions.assertEquals(testUser.getUsername(), response2.getString("recipe.author")),
                () -> Assertions.assertEquals(testRecipe2.getCalories(), response2.getFloat("recipe.calories"))
        );

    }

}
