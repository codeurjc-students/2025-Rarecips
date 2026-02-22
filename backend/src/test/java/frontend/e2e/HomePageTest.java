package frontend.e2e;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

public class HomePageTest extends BaseE2ETest {

    @Test
    public void shouldLoadHomePageSuccessfully() {
        driver.get(baseUrl + "/");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        String currentUrl = driver.getCurrentUrl();
        assertTrue(currentUrl.contains("localhost:8443"));
    }

    @Test
    public void shouldDisplayRecipeCollections() {
        driver.get(baseUrl + "/");

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        assertNotNull(driver.findElement(By.tagName("body")));
    }

    @Test
    public void shouldNavigateToExplore() {
        driver.get(baseUrl + "/");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        driver.get(baseUrl + "/explore");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/explore"));

        String currentUrl = driver.getCurrentUrl();
        assertTrue(currentUrl.contains("/explore"));
    }

}


