package backend.e2e;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.RecipeCollectionRepository;
import com.blasetvrtumi.rarecips.repository.NotificationRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@DirtiesContext
@org.springframework.test.context.ActiveProfiles("test")
public class APIAdminTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecipeCollectionRepository recipeCollectionRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User adminUser;
    private User regularUser;
    private String adminToken;
    private Map<String, String> cookies;

    private void deleteUserData(User user) {
        if (user == null || user.getUsername() == null) {
            return;
        }

        notificationRepository.deleteAll(notificationRepository
                .findByRecipient_UsernameOrSender_Username(user.getUsername(), user.getUsername()));
        recipeCollectionRepository.deleteAll(recipeCollectionRepository.findByUserUsername(user.getUsername()));
        User persistedUser = userRepository.findByUsername(user.getUsername());
        if (persistedUser != null) {
            userRepository.delete(persistedUser);
        }
    }

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.basePath = "/api/v1";
        RestAssured.useRelaxedHTTPSValidation();

        User existingAdmin = userRepository.findByUsername("admin");
        deleteUserData(existingAdmin);
        
        adminUser = new User("admin", "Admin", "Admin Bio", "http://localhost:9000/rarecips-images/user.png", "admin@example.com", passwordEncoder.encode("adminpass"));
        adminUser.setRole("ADMIN");
        userRepository.save(adminUser);

        User existingUser = userRepository.findByUsername("user_test");
        deleteUserData(existingUser);

        regularUser = new User("user_test", "User Test", "User Bio", "http://localhost:9000/rarecips-images/user.png", "user_test@example.com", passwordEncoder.encode("Password123!"));
        userRepository.save(regularUser);

        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("username", "admin");
        loginRequest.put("password", "adminpass");

        Response response = given()
            .contentType(ContentType.JSON)
            .body(loginRequest)
            .when()
            .put("/auth/login");
        
        response.then().statusCode(200);
        cookies = response.getCookies();
    }

    @AfterEach
    public void tearDown() {
        deleteUserData(adminUser);
        deleteUserData(regularUser);
    }

    @Test
    public void testGetSystemStatus_AsAdmin() {
        given()
            .cookies(cookies)
            .when()
            .get("/admin/system-status")
            .then()
            .log().all()
            .statusCode(200)
            .body("server", equalTo("admin_operational"))
            .body("database", anyOf(equalTo("admin_operational"), equalTo("admin_down")));
    }

    @Test
    public void testGetStats_AsAdmin() {
        given()
            .cookies(cookies)
            .param("range", "admin_last_7_days")
            .when()
            .get("/admin/stats")
            .then()
            .log().all()
            .statusCode(200)
            .body("totalUsers", greaterThanOrEqualTo(1))
            .body("userGrowthChart", notNullValue());
    }

    @Test
    public void testUserManagement_GetByRole() {
        given()
            .cookies(cookies)
            .param("role", "ADMIN")
            .when()
            .get("/users/role")
            .then()
            .log().all()
            .statusCode(200)
            .body("users", notNullValue())
            .body("users.find { it.username == 'admin' }", notNullValue());
    }

    @Test
    public void testUserManagement_SuspendAndUnsuspend() {
        given()
            .cookies(cookies)
            .queryParam("action", "suspend")
            .when()
            .put("/users/{username}/status", regularUser.getUsername())
            .then()
            .log().all()
            .statusCode(200)
            .body("message", containsString("suspended successfully"));

        given()
            .cookies(cookies)
            .queryParam("action", "unsuspend")
            .when()
            .put("/users/{username}/status", regularUser.getUsername())
            .then()
            .log().all()
            .statusCode(200)
            .body("message", containsString("unsuspended successfully"));
    }

    @Test
    public void testContentManagement_GetPendingRecipes() {
        given()
            .cookies(cookies)
            .when()
            .get("/recipes/pending")
            .then()
            .log().all()
            .statusCode(200)
            .body("recipes", notNullValue());
    }

    @Test
    public void testContentManagement_ReportedContent() {
        given()
            .cookies(cookies)
            .when()
            .get("/users/reported")
            .then()
            .log().all()
            .statusCode(200)
            .body("users", notNullValue());

        given()
            .cookies(cookies)
            .when()
            .get("/recipes/reported")
            .then()
            .log().all()
            .statusCode(200)
            .body("recipes", notNullValue());
            
        given()
            .cookies(cookies)
            .when()
            .get("/reviews/reported")
            .then()
            .log().all()
            .statusCode(200)
            .body("reviews", notNullValue());
    }
}
