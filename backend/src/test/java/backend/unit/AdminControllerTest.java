package backend.unit;

import com.blasetvrtumi.rarecips.controller.AdminController;
import com.blasetvrtumi.rarecips.repository.IngredientRepository;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.ReviewRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class AdminControllerTest {

    @InjectMocks
    private AdminController adminController;

    @Mock
    private DataSource dataSource;

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private IngredientRepository ingredientRepository;

    @Mock
    private Connection connection;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetSystemStatus_Success() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(1000)).thenReturn(true);
        
        ResponseEntity<Map<String, Object>> response = adminController.getSystemStatus();
        
        assertEquals(200, response.getStatusCodeValue());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals("admin_operational", body.get("server"));
        assertEquals("admin_operational", body.get("database"));
        assertEquals("admin_operational", body.get("api"));
    }

    @Test
    public void testGetStats_DefaultRange() {
        when(userRepository.count()).thenReturn(100L);
        when(recipeRepository.count()).thenReturn(50L);
        when(reviewRepository.count()).thenReturn(200L);
        when(ingredientRepository.count()).thenReturn(300L);

        when(userRepository.countByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(10L);
        when(recipeRepository.countByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(5L);

        ResponseEntity<Map<String, Object>> response = adminController.getStats("admin_last_7_days");

        assertEquals(200, response.getStatusCodeValue());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals(100L, body.get("totalUsers"));
        assertEquals(50L, body.get("totalRecipes"));
        assertNotNull(body.get("userGrowthChart"));
        assertNotNull(body.get("recipeGrowthChart"));
    }
}
