package backend.e2e;

import com.blasetvrtumi.rarecips.entity.Activity;
import com.blasetvrtumi.rarecips.repository.ActivityRepository;
import com.blasetvrtumi.rarecips.RarecipsApplication;
import io.restassured.RestAssured;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.annotation.DirtiesContext;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@DirtiesContext
@org.springframework.test.context.ActiveProfiles("test")
public class APIActivityTest {

    @Autowired
    private ActivityRepository activityRepository;

    @LocalServerPort
    private int port;

    private Activity testActivity;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.basePath = "/api/v1";
        RestAssured.useRelaxedHTTPSValidation();
        testActivity = new Activity();
        testActivity.setActivityType(Activity.ActivityType.CREATE_RECIPE.name());
        activityRepository.save(testActivity);
    }

    @AfterEach
    public void tearDown() {
        activityRepository.delete(testActivity);
    }

    @Test
    public void testGetLatestActivities() {
        given()
            .when()
            .get("/activities/latest")
            .then()
            .statusCode(200)
            .body("activities", notNullValue());
    }

    @Test
    public void testGetLatestReviews() {
        given()
            .param("limit", 5)
            .when()
            .get("/activities/latest-reviews")
            .then()
            .log().all()
            .statusCode(200)
            .body("reviews", notNullValue());
    }
}
