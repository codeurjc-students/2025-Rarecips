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
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
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
        driver.get("https://localhost:8443/login");
        driver.manage().window().maximize();

        pause(500);

        waitAndSendKeys(By.id("login-username"), username);
        waitAndSendKeys(By.id("login-password"), password);

        waitAndClick(By.id("loginBut"));

        wait.until(ExpectedConditions.urlToBe("https://localhost:8443/"));
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("body")));

        pause(2000);
    }
}


