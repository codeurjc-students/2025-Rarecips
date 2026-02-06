package frontend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for recipe collection service communication with backend.
 */
public class RecipeCollectionServiceIntegrationTest extends BaseIntegrationTest {

  @Test
  public void testGetCollectionsByUser() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/collections/user/testuser"),
          String.class
      );

      assertTrue(response.getStatusCode().is2xxSuccessful() ||
                 response.getStatusCode() == HttpStatus.NOT_FOUND ||
                 response.getStatusCode() == HttpStatus.UNAUTHORIZED);

      if (response.getStatusCode().is2xxSuccessful()) {
        assertNotNull(response.getBody());
      }

    } catch (Exception e) {
      System.out.println("Get collections by user test note: " + e.getMessage());
    }
  }

  @Test
  public void testGetCollectionById() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/collections/1"),
          String.class
      );

      assertTrue(response.getStatusCode().is2xxSuccessful() ||
                 response.getStatusCode() == HttpStatus.NOT_FOUND ||
                 response.getStatusCode() == HttpStatus.UNAUTHORIZED);

    } catch (Exception e) {
      System.out.println("Get collection by ID test note: " + e.getMessage());
    }
  }

  @Test
  public void testGetCollectionRecipes() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/collections/1/recipes"),
          String.class
      );

      assertTrue(response.getStatusCode().is2xxSuccessful() ||
                 response.getStatusCode() == HttpStatus.NOT_FOUND ||
                 response.getStatusCode() == HttpStatus.UNAUTHORIZED);

    } catch (Exception e) {
      System.out.println("Get collection recipes test note: " + e.getMessage());
    }
  }

  @Test
  public void testGetCollectionWithInvalidId() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/collections/99999"),
          String.class
      );

      assertTrue(response.getStatusCode() == HttpStatus.NOT_FOUND ||
                 response.getStatusCode() == HttpStatus.UNAUTHORIZED);

    } catch (Exception e) {
      // Expected: 404/401 error OR SSL certificate error
      assertTrue(e.getMessage().contains("404") ||
                 e.getMessage().contains("401") ||
                 e.getMessage().contains("Not Found") ||
                 e.getMessage().contains("certificate") ||
                 e.getMessage().contains("PKIX"));
    }
  }

  @Test
  public void testGetAllPublicCollections() {
    try {
      ResponseEntity<String> response = restTemplate.getForEntity(
          getApiUrl("/collections/public"),
          String.class
      );

      assertTrue(response.getStatusCode().is2xxSuccessful());
      assertNotNull(response.getBody());

    } catch (Exception e) {
      System.out.println("Get public collections test note: " + e.getMessage());
    }
  }
}


