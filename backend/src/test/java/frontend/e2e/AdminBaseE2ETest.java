package frontend.e2e;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class AdminBaseE2ETest extends BaseE2ETest {

    protected void login(String username, String password) {
        driver.get(baseUrl + "/login");
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
        
        wait.until(ExpectedConditions.urlContains("/login"));
        
        wait.until(ExpectedConditions.presenceOfElementLocated(By.id("login-username")));
        
        int retries = 3;
        while (retries > 0) {
            try {
                // Short wait to allow Angular to stabilize after loading
                try { Thread.sleep(500); } catch (InterruptedException ignored) {}

                WebElement usernameInput = driver.findElement(By.id("login-username"));
                usernameInput.clear();
                usernameInput.sendKeys(username);
                
                WebElement passwordInput = driver.findElement(By.id("login-password"));
                passwordInput.clear();
                passwordInput.sendKeys(password);
                
                WebElement loginButton = driver.findElement(By.id("loginBut"));
                try {
                    loginButton.click();
                } catch (Exception e) {
                    jsClick(loginButton);
                }
                break;
            } catch (StaleElementReferenceException e) {
                retries--;
                if (retries == 0) throw e;
                driver.get(baseUrl + "/login"); // Refresh as fallback
                wait.until(ExpectedConditions.presenceOfElementLocated(By.id("login-username")));
            }
        }
        
        WebDriverWait successWait = new WebDriverWait(driver, Duration.ofSeconds(30));
        successWait.until(ExpectedConditions.visibilityOfElementLocated(By.id("userMenuButton")));
    }

    protected void loginAsAdmin() {
        login("admin", "adminpass");
    }

    protected void loginAsUser() {
        login("user", "pass");
    }

    protected void logout() {
        System.out.println("Logging out...");
        driver.manage().deleteAllCookies();
        driver.get(baseUrl + "/logout");
        try { Thread.sleep(1000); } catch (InterruptedException ignored) {}
        driver.get(baseUrl + "/"); // Back to home
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        wait.until(ExpectedConditions.presenceOfElementLocated(By.id("loginButNavbar")));
    }

    protected void scrollToElement(WebElement element) {
        ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element);
        try { Thread.sleep(800); } catch (InterruptedException ignored) {}
    }

    protected void jsClick(WebElement element) {
        ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }

    protected void jsSetInput(WebElement element, String value) {
        String script = "arguments[0].value = arguments[1]; " +
                        "arguments[0].dispatchEvent(new Event('input', { bubbles: true })); " +
                        "arguments[0].dispatchEvent(new Event('change', { bubbles: true }));";
        ((org.openqa.selenium.JavascriptExecutor) driver).executeScript(script, element, value);
    }

    protected void waitAndClick(By locator, int timeoutSeconds) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds));
        try {
            WebElement element = wait.until(ExpectedConditions.presenceOfElementLocated(locator));
            
            scrollToElement(element);
            
            try {
                wait.until(ExpectedConditions.visibilityOf(element));
            } catch (Exception ignored) {}

            try {
                element.click();
            } catch (Exception e) {
                System.out.println("Standard click failed, using jsClick for: " + locator);
                jsClick(element);
            }
        } catch (Exception e) {
            System.err.println("CRITICAL: Failed to find/click element: " + locator);
            System.err.println("Current URL: " + driver.getCurrentUrl());
            throw e;
        }
    }

    protected void createRecipe(String title, String description) {
        System.out.println("Creating recipe: " + title);
        driver.get(baseUrl + "/recipes/create");
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
        
        WebElement labelInput = wait.until(ExpectedConditions.presenceOfElementLocated(By.id("recipeLabel")));
        jsSetInput(labelInput, title);
        
        WebElement descInput = wait.until(ExpectedConditions.presenceOfElementLocated(By.id("recipeDesc")));
        jsSetInput(descInput, description);
        
        WebElement prepTime = driver.findElement(By.name("prepTime"));
        jsSetInput(prepTime, "15");
        
        WebElement servings = driver.findElement(By.name("servings"));
        jsSetInput(servings, "2");

        WebElement publishBtn = wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".publishBut button")));
        scrollToElement(publishBtn);
        jsClick(publishBtn);

        wait.until(ExpectedConditions.not(ExpectedConditions.urlContains("/recipes/create")));
        wait.until(ExpectedConditions.urlMatches(".*/recipes/\\d+.*"));
    }

    protected void reportRecipe(String recipeId) {
        System.out.println("Reporting recipe: " + recipeId);
        driver.get(baseUrl + "/recipes/" + recipeId);
        waitAndClick(By.cssSelector(".ti-flag"), 15);
        try { Thread.sleep(1000); } catch (InterruptedException ignored) {}
    }

    protected void reportUser(String username) {
        System.out.println("Reporting user: " + username);
        driver.get(baseUrl + "/users/" + username);
        waitAndClick(By.className("userReportBut"), 15);
        try { Thread.sleep(1000); } catch (InterruptedException ignored) {}
    }

    protected void addReviewAndReport(String recipeId, String comment) {
        System.out.println("Adding and reporting review for recipe: " + recipeId);
        driver.get(baseUrl + "/recipes/" + recipeId);
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
        
        wait.until(ExpectedConditions.presenceOfElementLocated(By.className("recipe-title")));

        wait.until(d -> {
            List<WebElement> currentTabs = d.findElements(By.className("tab"));
            for (WebElement tab : currentTabs) {
                try {
                    if (tab.getAttribute("innerHTML").contains("ti-stars")) {
                        jsClick(tab);
                        return true;
                    }
                } catch (Exception ignored) {}
            }
            return false;
        });
        
        waitAndClick(By.className("addReviewBut"), 15);
        
        WebElement editor = wait.until(ExpectedConditions.presenceOfElementLocated(By.className("reviewEditor")));
        editor.sendKeys(comment);
        
        List<WebElement> stars = wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(By.cssSelector(".reviewForm .ti-star-filled")));
        if (!stars.isEmpty()) {
            jsClick(stars.get(stars.size() - 1));
        }
        
        WebElement submitBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(., 'Submit') or contains(., 'Enviar') or contains(translate(., 'SUBMIT', 'submit'), 'submit') or contains(translate(., 'ENVIAR', 'enviar'), 'enviar')]")));
        jsClick(submitBtn);
        
        try { Thread.sleep(2000); } catch (InterruptedException ignored) {}
        WebElement reportBtn = wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".reviewCont .ti-flag")));
        jsClick(reportBtn);
    }
}
