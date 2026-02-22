package backend.e2e;

import com.blasetvrtumi.rarecips.entity.Ingredient;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.IngredientRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
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

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@DirtiesContext
@org.springframework.test.context.ActiveProfiles("test")
public class APIIngredientTest {

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private UserRepository userRepository;

    @LocalServerPort
    private int port;

    private Ingredient testIngredient;
    private User adminUser;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.basePath = "/api/v1";
        RestAssured.useRelaxedHTTPSValidation();

        adminUser = new User("adminuser", "password", "admin@test.com", null, "Admin User", "Admin", "Admin bio");
        adminUser.setRole("ADMIN");
        userRepository.save(adminUser);

        Authentication auth = new UsernamePasswordAuthenticationToken(adminUser.getUsername(), adminUser.getPassword());
        SecurityContextHolder.getContext().setAuthentication(auth);

        testIngredient = new Ingredient("Tomato", "", "");
        ingredientRepository.save(testIngredient);
    }

    @AfterEach
    public void tearDown() {
        if (testIngredient != null && testIngredient.getId() != null) {
            ingredientRepository.deleteById(testIngredient.getId());
        }
        if (adminUser != null && adminUser.getUsername() != null) {
            User user = userRepository.findByUsername(adminUser.getUsername());
            if (user != null) {
                userRepository.delete(user);
            }
        }
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testGetIngredientById() {
        given()
            .when()
            .get("/ingredients/{id}", testIngredient.getId())
            .then()
            .log().all()
            .statusCode(200)
            .body("food", equalTo("Tomato"));
    }

    @Test
    public void testGetAllIngredients() {
        given()
            .param("page", 0)
            .param("size", 10)
            .when()
            .get("/ingredients")
            .then()
            .log().all()
            .statusCode(200)
            .body("content", notNullValue());
    }

    @Test
    public void testSearchIngredients() {
        given()
            .param("query", "Tom")
            .param("page", 0)
            .param("size", 10)
            .when()
            .get("/ingredients/search")
            .then()
            .log().all()
            .statusCode(200)
            .body("content", notNullValue());
    }

    @Test
    public void testGetIngredientNames() {
        given()
            .when()
            .get("/ingredients/names")
            .then()
            .log().all()
            .statusCode(200)
            .body("$", notNullValue());
    }
}
