package frontend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, classes = RarecipsApplication.class)
@ActiveProfiles("test")
@AutoConfigureWebMvc
public class UIRecipeServiceTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void shouldConnectToRecipeAPIFromFrontendPerspective() throws Exception {
        String apiUrl = "http://localhost:8443/api/recipes?order=lastmod&size=4&page=0";

        ResponseEntity<String> response = restTemplate.getForEntity(apiUrl, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();

        JsonNode recipes = objectMapper.readTree(response.getBody()).get("recipes");
        assertThat(recipes.isArray()).isTrue();
        assertThat(recipes.size()).isGreaterThan(0);
    }
    
}
