package frontend.e2e;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ExplorePageTest extends BaseE2ETest {

    @Test
    public void shouldLoadExplorePage() {
        driver.get(baseUrl + "/explore");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        String currentUrl = driver.getCurrentUrl();
        assertTrue(currentUrl.contains("/explore"));
    }

    @Test
    public void shouldDisplaySearchTabs() {
        driver.get(baseUrl + "/explore");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".tabs, .tab")));

        List<WebElement> tabs = driver.findElements(By.cssSelector(".tab"));
        assertTrue(tabs.size() > 0);
    }

    @Test
    public void shouldHaveActiveTab() {
        driver.get(baseUrl + "/explore");

        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".tab.active, .tab")));

        List<WebElement> activeTabs = driver.findElements(By.cssSelector(".tab.active, .tab"));
        assertTrue(activeTabs.size() > 0);
    }

}

