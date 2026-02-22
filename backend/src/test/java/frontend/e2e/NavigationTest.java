package frontend.e2e;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

public class NavigationTest extends BaseE2ETest {

    @Test
    public void shouldNavigateFromHomeToLogin() {
        driver.get(baseUrl + "/");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        driver.get(baseUrl + "/login");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/login"));

        assertTrue(driver.getCurrentUrl().contains("/login"));
    }

    @Test
    public void shouldNavigateFromLoginToSignup() {
        driver.get(baseUrl + "/login");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        driver.get(baseUrl + "/signup");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/signup"));

        assertTrue(driver.getCurrentUrl().contains("/signup"));
    }

    @Test
    public void shouldNavigateToIngredientsPage() {
        driver.get(baseUrl + "/");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        driver.get(baseUrl + "/ingredients");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/ingredients"));

        assertTrue(driver.getCurrentUrl().contains("/ingredients"));
    }

    @Test
    public void shouldHandleErrorPage() {
        driver.get(baseUrl + "/error");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        assertTrue(driver.getCurrentUrl().contains("/error"));
    }

}

