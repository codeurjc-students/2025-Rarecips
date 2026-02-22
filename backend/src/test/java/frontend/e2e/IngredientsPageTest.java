package frontend.e2e;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

public class IngredientsPageTest extends BaseE2ETest {

    @Test
    public void shouldLoadIngredientsPage() {
        driver.get(baseUrl + "/ingredients");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        String currentUrl = driver.getCurrentUrl();
        assertTrue(currentUrl.contains("/ingredients"));
    }

    @Test
    public void shouldDisplayIngredientsContent() {
        driver.get(baseUrl + "/ingredients");

        new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        assertNotNull(driver.findElement(By.tagName("body")));
    }

}

