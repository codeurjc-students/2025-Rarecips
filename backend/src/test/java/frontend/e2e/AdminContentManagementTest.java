package frontend.e2e;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class AdminContentManagementTest extends AdminBaseE2ETest {

    @Test
    public void testContentManagementAsAdmin() {
        loginAsAdmin();
        createRecipe("Admin Recipe", "This recipe will be reported by a user");
        String adminRecipeUrl = driver.getCurrentUrl();
        String adminRecipeId = adminRecipeUrl.substring(adminRecipeUrl.lastIndexOf("/") + 1);
        logout();

        loginAsUser();
        
        reportRecipe(adminRecipeId);
        
        reportUser("admin");
        
        createRecipe("User Pending Recipe", "This needs admin approval");
        
        logout();
        
        loginAsAdmin();
        driver.get(baseUrl + "/admin");
        
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(30));
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".admin-stats-grid")));
        
        waitAndClick(By.id("pendingRecipesBtn"), 20);
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".visibleBackdrop")));
        waitAndClick(By.cssSelector("button .ti-x"), 15);
        
        waitAndClick(By.id("contentReportsBtn"), 20);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".visibleBackdrop")));
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".ti-eye-exclamation")));
        waitAndClick(By.cssSelector("button .ti-x"), 15);
        
        logout();
    }
}
