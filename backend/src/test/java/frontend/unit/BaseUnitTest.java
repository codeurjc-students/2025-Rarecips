package frontend.unit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.junit.jupiter.api.extension.TestWatcher;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import java.time.Duration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import com.blasetvrtumi.rarecips.RarecipsApplication;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@ActiveProfiles("test")
public class BaseUnitTest {

    protected WebDriver driver;
    protected SeleniumHelper helper;

    protected String baseUrl = "https://localhost:8443"; //Angular endpoint

    @BeforeEach
    public void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless");
        options.setAcceptInsecureCerts(true);
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--window-size=1920,1080");
        driver = new ChromeDriver(options);
        helper = new SeleniumHelper(driver);
    }

    @RegisterExtension
    TestWatcher screenshotOnFailure = new TestWatcher() {
        @Override
        public void testFailed(ExtensionContext context, Throwable cause) {
            if (driver == null) return;
            try {
                File src = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
                Path dest = Path.of("target", "surefire-reports", "screenshots", context.getDisplayName() + ".png");
                Files.createDirectories(dest.getParent());
                Files.copy(src.toPath(), dest, StandardCopyOption.REPLACE_EXISTING);
            } catch (Exception e) {
            }
        }
    };

    protected void jsClick(WebElement element) {
        helper.jsClick(element);
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

}
