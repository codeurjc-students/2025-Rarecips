package backend.e2e;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.entity.Ingredient;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import io.restassured.RestAssured;
import io.restassured.path.json.JsonPath;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.annotation.DirtiesContext;

import java.util.Arrays;
import java.util.Map;
import java.sql.Blob;
import java.util.ArrayList;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@DirtiesContext
public class APIRecipeTest {

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser = new User("testuser", "testpassword", "test@example.com", null, "Test User",
            "This is a test user.", "");

    private Recipe testRecipe1;
    private Recipe testRecipe2;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "http://localhost:8443/api";

        userRepository.save(testUser);

        testRecipe1 = new Recipe(
                "Spaghetti Bolognese", // label
                "Classic Italian pasta", // description
                new ArrayList<>(), // dietLabels
                new ArrayList<>(), // healthLabels
                new ArrayList<>(), // cautions
                4, // people
                new ArrayList<>(), // ingredients
                1, // difficulty (int)
                new ArrayList<>(), // dishTypes
                new ArrayList<>(), // mealTypes
                new ArrayList<>(), // cuisineType
                45.0f, // totalTime
                500.0f, // totalWeight
                650.0f, // calories
                testUser, // author
                new ArrayList<>() // steps
        );

        testRecipe2 = new Recipe(
                "Chicken Curry", // label
                "Spicy Indian curry", // description
                new ArrayList<>(), // dietLabels
                new ArrayList<>(), // healthLabels
                new ArrayList<>(), // cautions
                4, // people
                new ArrayList<>(), // ingredients
                1, // difficulty (int)
                new ArrayList<>(), // dishTypes
                new ArrayList<>(), // mealTypes
                new ArrayList<>(), // cuisineType
                30.0f, // totalTime
                600.0f, // totalWeight
                520.0f, // calories
                testUser, // author
                new ArrayList<>() // steps
        );

        recipeRepository.save(testRecipe1);
        recipeRepository.save(testRecipe2);
    }

    @AfterEach
    public void tearDown() {
        recipeRepository.delete(testRecipe1);
        recipeRepository.delete(testRecipe2);
    }

    @Test
    public void testGetRecipeById() {
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
                .body("size()", greaterThan(0))
                .body("size()", lessThanOrEqualTo(4));
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
