package frontend.e2e;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class AdminUserManagementTest extends AdminBaseE2ETest {

    @Test
    public void testManageUsersAsAdmin() {
        loginAsAdmin();
        driver.get(baseUrl + "/admin");
        
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(30));
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".admin-stats-grid")));
        
        waitAndClick(By.id("manageAdminsBtn"), 15);
        
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".visibleBackdrop")));
        waitAndClick(By.cssSelector("button .ti-x"), 15);
        
        waitAndClick(By.id("viewAllUsersBtn"), 15);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".visibleBackdrop")));
        wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//*[contains(text(), 'user')]")));
        waitAndClick(By.cssSelector("button .ti-x"), 15);
        
        waitAndClick(By.id("suspendedUsersBtn"), 15);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".visibleBackdrop")));
        waitAndClick(By.cssSelector("button .ti-x"), 15);
        
        logout();
    }
}
