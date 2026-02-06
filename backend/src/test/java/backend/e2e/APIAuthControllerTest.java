package backend.e2e;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.annotation.DirtiesContext;

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@DirtiesContext
@org.springframework.test.context.ActiveProfiles("test")
public class APIAuthControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.basePath = "/api/v1";
        RestAssured.useRelaxedHTTPSValidation();
    }

    @AfterEach
    public void tearDown() {
        if (testUser != null && testUser.getUsername() != null) {
            User user = userRepository.findByUsername(testUser.getUsername());
            if (user != null) {
                userRepository.delete(user);
            }
        }
    }

    @Test
    public void testGetAllUsernames() {
        given()
            .when()
            .get("/auth/usernames")
            .then()
            .log().all()
            .statusCode(200)
            .body("$", notNullValue());
    }

    @Test
    public void testCheckEmailExists() {
        given()
            .param("email", "nonexistent@example.com")
            .when()
            .get("/auth/emails")
            .then()
            .log().all()
            .statusCode(200)
            .body(equalTo("false"));
    }
}
