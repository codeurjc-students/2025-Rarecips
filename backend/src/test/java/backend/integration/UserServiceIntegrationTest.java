package backend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import static org.assertj.core.api.Assertions.assertThat;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.service.UserService;
import org.springframework.data.domain.Page;

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

    @Test
    void shouldFindUsersByRole() {
        User admin = new User("admin", "pass", "admin@test.com", null, "Admin", "desc", "bio");
        admin.setRole("ADMIN");
        userService.save(admin);
        
        entityManager.flush();
        Page<User> admins = userService.getUsersByRole(User.Role.ADMIN, 0, 10);
        assertThat(admins.getContent()).isNotEmpty();
        assertThat(admins.getContent().stream().anyMatch(u -> u.getUsername().equals("admin"))).isTrue();
    }

    @Test
    void shouldFindSuspendedUsers() {
        User user = new User("suspended_user", "pass", "s@test.com", null, "Suspended", "desc", "bio");
        user.setSuspended(true);
        userService.save(user);

        entityManager.flush();
        Page<User> suspended = userService.getFilteredUsersStatus(true, 0, 10);
        assertThat(suspended.getContent()).isNotEmpty();
        assertThat(suspended.getContent().stream().anyMatch(u -> u.getUsername().equals("suspended_user"))).isTrue();
    }
}
