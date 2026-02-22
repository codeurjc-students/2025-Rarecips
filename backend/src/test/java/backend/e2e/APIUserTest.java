package backend.e2e;

import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.RarecipsApplication;
import io.restassured.RestAssured;
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
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@DirtiesContext
@org.springframework.test.context.ActiveProfiles("test")
public class APIUserTest {

    @Autowired
    private UserRepository userRepository;

    @LocalServerPort
    private int port;

    private User testUser;

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
    }

    @AfterEach
    public void tearDown() {
        if (testUser != null && testUser.getUsername() != null) {
            User user = userRepository.findByUsername(testUser.getUsername());
            if (user != null) {
                userRepository.delete(user);
            }
        }
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testGetUserByUsername() {
        given()
            .when()
            .get("/users/{username}", testUser.getUsername())
            .then()
            .log().all()
            .statusCode(200)
            .body("username", equalTo("testuser"));
    }

    @Test
    public void testGetUserRecipes() {
        given()
            .param("display", "recipes")
            .param("page", 0)
            .param("size", 10)
            .when()
            .get("/users/{username}", testUser.getUsername())
            .then()
            .log().all()
            .statusCode(200)
            .body("content", notNullValue());
    }

    @Test
    public void testGetUserReviews() {
        given()
            .param("display", "reviews")
            .param("page", 0)
            .param("size", 10)
            .when()
            .get("/users/{username}", testUser.getUsername())
            .then()
            .log().all()
            .statusCode(200)
            .body("content", notNullValue());
    }

    @Test
    public void testGetUserCollections() {
        given()
            .param("display", "collections")
            .param("page", 0)
            .param("size", 10)
            .when()
            .get("/users/{username}", testUser.getUsername())
            .then()
            .log().all()
            .statusCode(200)
            .body("content", notNullValue());
    }
}
