package frontend.unit;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;

public class SeleniumHelper {

    private WebDriver driver;
    private WebDriverWait wait;
    private JavascriptExecutor js;

    public SeleniumHelper(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(30));
        this.js = (JavascriptExecutor) driver;
    }

    public WebElement waitAndGetElement(By locator) {
        WebElement element = wait.until(ExpectedConditions.presenceOfElementLocated(locator));
        js.executeScript("arguments[0].scrollIntoView(true);", element);
        return element;
    }

    public WebElement waitForClickable(By locator) {
        WebElement element = wait.until(ExpectedConditions.elementToBeClickable(locator));
        js.executeScript("arguments[0].scrollIntoView(true);", element);
        return element;
    }

    public void jsClick(WebElement element) {
        js.executeScript("arguments[0].click();", element);
    }

    public void jsClickAfterVisible(By locator) {
        WebElement element = waitForClickable(locator);
        jsClick(element);
    }

    public void waitAndClick(By locator) {
        WebElement element = waitForClickable(locator);
        element.click();
    }

    public void waitAndSendKeys(By locator, String keys) {
        WebElement element = waitForClickable(locator);
        element.clear();
        element.sendKeys(keys);
    }

    public void waitForElementPresenceAndVanish(By locator) {
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(locator));
            wait.until(ExpectedConditions.invisibilityOfElementLocated(locator));
        } catch (Exception e) {
            // Element may have already disappeared, which is fine
        }
    }

    public void waitForPageReady() {
        wait.until(driver -> {
            Boolean ready = (Boolean) js.executeScript(
                "return document.readyState === 'complete' && " +
                "typeof angular !== 'undefined' && angular.element(document).injector().get('$http').pendingRequests.length === 0"
            );
            return ready != null && ready;
        });
    }

    public void pause(long milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public void login(String username, String password) {
        // Wait for server to become available
        waitForServerReady();

        driver.get("https://localhost:8443/login");
        driver.manage().window().maximize();

        pause(1000);

        // Wait longer for login form to render in CI environment
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(By.id("login-username")));
        } catch (Exception e) {
            // Refresh and try again
            driver.navigate().refresh();
            pause(2000);
            wait.until(ExpectedConditions.presenceOfElementLocated(By.id("login-username")));
        }

        waitAndSendKeys(By.id("login-username"), username);
        pause(500);

        waitAndSendKeys(By.id("login-password"), password);
        pause(500);

        waitAndClick(By.id("loginBut"));

        wait.until(ExpectedConditions.urlToBe("https://localhost:8443/"));
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("body")));

        pause(2000);
    }

    /**
     * Wait for the server to become ready and the Angular app to initialize
     */
    public void waitForServerReady() {
        int maxRetries = 15;
        int attempt = 0;

        while (attempt < maxRetries) {
            try {
                // Try to load the login page
                driver.get("https://localhost:8443/login");

                // Wait for basic page load
                wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("body")));

                // Check if Angular app has initialized
                Boolean appReady = (Boolean) js.executeScript(
                    "return document.querySelector('app-root') != null && " +
                    "document.body.innerHTML.includes('login')"
                );

                if (appReady != null && appReady) {
                    pause(500);
                    return;
                }

                attempt++;
                pause(1000);
            } catch (Exception e) {
                attempt++;
                pause(1000);
                if (attempt >= maxRetries) {
                    throw new RuntimeException(
                        "Server did not become ready after " + maxRetries + " attempts. " +
                        "Make sure the application is running on https://localhost:8443", e);
                }
            }
        }
    }
}
