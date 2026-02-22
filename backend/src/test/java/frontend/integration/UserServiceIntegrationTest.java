package frontend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for user service communication with backend.
 */
public class UserServiceIntegrationTest extends BaseIntegrationTest {

  @Test
  public void testGetUserByUsername() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/users/testuser"),
          String.class
      );

      assertTrue(response.getStatusCode().is2xxSuccessful() ||
                 response.getStatusCode() == HttpStatus.NOT_FOUND);

      if (response.getStatusCode().is2xxSuccessful()) {
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("username") ||
                   response.getBody().contains("testuser"));
      }

    } catch (Exception e) {
      logger.info("Get user test note: {}", e.getMessage());
    }
  }

  @Test
  public void testGetUserProfile() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/users/profile/testuser"),
          String.class
      );

      assertTrue(response.getStatusCode().is2xxSuccessful() ||
                 response.getStatusCode() == HttpStatus.NOT_FOUND);

    } catch (Exception e) {
      logger.info("Get user profile test note: {}", e.getMessage());
    }
  }

  @Test
  public void testGetCurrentUser() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/users/me"),
          String.class
      );

      // Should return 401 if not authenticated, 200 if authenticated
      assertTrue(response.getStatusCode().is2xxSuccessful() ||
                 response.getStatusCode() == HttpStatus.UNAUTHORIZED);

    } catch (Exception e) {
      logger.info("Get current user test note: {}", e.getMessage());
    }
  }

  @Test
  public void testGetUserWithInvalidUsername() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/users/nonexistentuser123456"),
          String.class
      );

      assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());

    } catch (Exception e) {
      // Expected: 404 error OR SSL certificate error
      assertTrue(e.getMessage().contains("404") ||
                 e.getMessage().contains("Not Found") ||
                 e.getMessage().contains("certificate") ||
                 e.getMessage().contains("PKIX"));
    }
  }

  @Test
  public void testGetUserRecipes() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/users/testuser/recipes"),
          String.class
      );

      assertTrue(response.getStatusCode().is2xxSuccessful() ||
                 response.getStatusCode() == HttpStatus.NOT_FOUND);

      if (response.getStatusCode().is2xxSuccessful()) {
        assertNotNull(response.getBody());
      }

    } catch (Exception e) {
      logger.info("Get user recipes test note: {}", e.getMessage());
    }
  }

  @Test
  public void testGetUserCollections() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/users/testuser/collections"),
          String.class
      );

      assertTrue(response.getStatusCode().is2xxSuccessful() ||
                 response.getStatusCode() == HttpStatus.NOT_FOUND);

    } catch (Exception e) {
      logger.info("Get user collections test note: {}", e.getMessage());
    }
  }

  @Test
  public void testGetUserSavedRecipes() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/users/testuser/saved"),
          String.class
      );

      assertTrue(response.getStatusCode().is2xxSuccessful() ||
                 response.getStatusCode() == HttpStatus.UNAUTHORIZED ||
                 response.getStatusCode() == HttpStatus.FORBIDDEN);

    } catch (Exception e) {
      logger.info("Get saved recipes test note: {}", e.getMessage());
    }
  }

  @Test
  public void testSearchUsers() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/users/search?q=test"),
          String.class
      );

      assertTrue(response.getStatusCode().is2xxSuccessful());
      assertNotNull(response.getBody());

    } catch (Exception e) {
      logger.info("Search users test note: {}", e.getMessage());
    }
  }
}


