package backend.e2e;

import com.blasetvrtumi.rarecips.entity.RecipeCollection;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.RecipeCollectionRepository;
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
import org.springframework.test.annotation.DirtiesContext;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashMap;
import java.util.Map;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@DirtiesContext
@org.springframework.test.context.ActiveProfiles("test")
public class APIRecipeCollectionTest {

    @Autowired
    private RecipeCollectionRepository collectionRepository;

    @Autowired
    private UserRepository userRepository;

    @LocalServerPort
    private int port;

    private RecipeCollection testCollection;
    private User testUser;

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

        testCollection = new RecipeCollection("My Collection", testUser, false);
        collectionRepository.save(testCollection);
    }

    @AfterEach
    public void tearDown() {
        if (testUser != null && testUser.getUsername() != null) {
            collectionRepository.findByUserUsername(testUser.getUsername()).forEach(collection -> {
                collectionRepository.delete(collection);
            });
        }

        if (testCollection != null && testCollection.getId() != null) {
            try {
                collectionRepository.deleteById(testCollection.getId());
            } catch (Exception e) {
            }
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
    public void testGetCollectionById() {
        given()
            .when()
            .get("/collections/{id}", testCollection.getId())
            .then()
            .log().all()
            .statusCode(200)
            .body("title", equalTo("My Collection"));
    }

    @Test
    public void testGetUserCollections() {
        given()
            .param("username", testUser.getUsername())
            .when()
            .get("/collections")
            .then()
            .log().all()
            .statusCode(200)
            .body("$", notNullValue());
    }

    @Test
    public void testGetPopularPublicCollections() {
        given()
            .param("limit", 10)
            .when()
            .get("/collections/public/popular")
            .then()
            .log().all()
            .statusCode(200)
            .body("$", notNullValue());
    }

    @Test
    public void testSearchCollections() {
        given()
            .param("q", "test")
            .param("page", 0)
            .param("size", 9)
            .when()
            .get("/collections/search")
            .then()
            .log().all()
            .statusCode(200)
            .body("content", notNullValue())
            .body("total", greaterThanOrEqualTo(0));
    }

    @Test
    public void testSearchCollectionsWithSort() {
        given()
            .param("page", 0)
            .param("size", 9)
            .param("sort", "title")
            .param("direction", "asc")
            .when()
            .get("/collections/search")
            .then()
            .log().all()
            .statusCode(200)
            .body("content", notNullValue());
    }

}
