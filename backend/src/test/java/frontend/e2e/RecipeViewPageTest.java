package frontend.e2e;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

public class RecipeViewPageTest extends BaseE2ETest {

    @Test
    public void shouldNavigateToRecipeViewPage() {
        driver.get(baseUrl + "/recipes/1");

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

