package backend.e2e;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.annotation.DirtiesContext;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@DirtiesContext
@org.springframework.test.context.ActiveProfiles("test")
public class APIEnumControllerTest {

    @LocalServerPort
    private int port;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.basePath = "/api/v1";
        RestAssured.useRelaxedHTTPSValidation();
    }

    @Test
    public void testGetDifficultyLevels() {
        given()
            .when()
            .get("/enums/difficulty")
            .then()
            .log().all()
            .statusCode(200)
            .body("$", notNullValue())
            .body("size()", greaterThan(0));
    }

    @Test
    public void testGetCuisineTypes() {
        given()
            .when()
            .get("/enums/cuisine-types")
            .then()
            .log().all()
            .statusCode(200)
            .body("$", notNullValue())
            .body("size()", greaterThan(0));
    }

    @Test
    public void testGetCautions() {
        given()
            .when()
            .get("/enums/cautions")
            .then()
            .log().all()
            .statusCode(200)
            .body("$", notNullValue())
            .body("size()", greaterThan(0));
    }

    @Test
    public void testGetDietLabels() {
        given()
            .when()
            .get("/enums/diet-labels")
            .then()
            .log().all()
            .statusCode(200)
            .body("$", notNullValue())
            .body("size()", greaterThan(0));
    }

    @Test
    public void testGetDishTypes() {
        given()
            .when()
            .get("/enums/dish-types")
            .then()
            .log().all()
            .statusCode(200)
            .body("$", notNullValue())
            .body("size()", greaterThan(0));
    }

    @Test
    public void testGetHealthLabels() {
        given()
            .when()
            .get("/enums/health-labels")
            .then()
            .log().all()
            .statusCode(200)
            .body("$", notNullValue())
            .body("size()", greaterThan(0));
    }

    @Test
    public void testGetMealTypes() {
        given()
            .when()
            .get("/enums/meal-types")
            .then()
            .log().all()
            .statusCode(200)
            .body("$", notNullValue())
            .body("size()", greaterThan(0));
    }
}
