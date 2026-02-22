package backend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import static org.assertj.core.api.Assertions.assertThat;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.service.UserService;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

@SpringBootTest(classes = RarecipsApplication.class)
@ActiveProfiles("test")
@Transactional
public class UserServiceIntegrationTest {

    @Autowired
    private UserService userService;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void shouldCreateAndRetrieveUser() {
        User user = new User("testuser", "password", "test@example.com", null, "Test User", "desc", "bio");
        User savedUser = userService.save(user);
        entityManager.flush();
        User retrieved = userService.findByUsername(savedUser.getUsername());
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getUsername()).isEqualTo("testuser");
    }
}
