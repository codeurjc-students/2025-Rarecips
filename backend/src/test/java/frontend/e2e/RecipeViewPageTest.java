package frontend.e2e;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import io.restassured.RestAssured;
import io.restassured.path.json.JsonPath;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

public class RecipeViewPageTest extends BaseE2ETest {

    @Test
    public void shouldNavigateToRecipeViewPage() {
        RestAssured.port = port;
        RestAssured.baseURI = "https://localhost";
        RestAssured.basePath = "/api/v1";
        RestAssured.useRelaxedHTTPSValidation();

        JsonPath response = RestAssured
                .given()
                .queryParam("page", 0)
                .queryParam("size", 1)
                .when()
                .get("/recipes/search")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath();

        Long recipeId = response.getLong("recipes[0].id");
        assertNotNull(recipeId);

        driver.get(baseUrl + "/recipes/" + recipeId);

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        String currentUrl = driver.getCurrentUrl();
        assertTrue(currentUrl.contains("/recipes/"));
    }

    @Test
    public void shouldHandleInvalidRecipeId() {
        driver.get(baseUrl + "/recipes/99999999");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        assertNotNull(driver.findElement(By.tagName("body")));
    }

}

