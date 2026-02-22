package frontend.integration;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.beans.factory.annotation.Autowired;
import org.junit.jupiter.api.BeforeEach;

/**
 * Base class for integration tests that verify frontend services
 * interact correctly with the backend API.
 */
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    classes = com.blasetvrtumi.rarecips.RarecipsApplication.class
)
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

  protected final Logger logger = LoggerFactory.getLogger(this.getClass());

  @LocalServerPort
  protected int port;

  @Autowired
  protected TestRestTemplate restTemplate;

  protected String baseUrl;

  @BeforeEach
  public void setUp() {
    baseUrl = "https://localhost:" + port;
  }

  protected String getApiUrl(String endpoint) {
    return baseUrl + "/api" + endpoint;
  }
}


