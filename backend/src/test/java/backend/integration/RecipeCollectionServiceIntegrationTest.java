package backend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import static org.assertj.core.api.Assertions.assertThat;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.entity.RecipeCollection;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.service.RecipeCollectionService;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

@SpringBootTest(classes = RarecipsApplication.class)
@ActiveProfiles("test")
@Transactional
public class RecipeCollectionServiceIntegrationTest {

    @Autowired
    private RecipeCollectionService collectionService;

    @Autowired
    private UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void shouldCreateAndRetrieveCollection() {
        User user = new User("testuser", "Test User", "bio", null, "", "test@example.com", "password");
        userRepository.save(user);
        entityManager.flush();
        RecipeCollection savedCollection = collectionService.createCollection(user.getUsername(), "My Collection", false);
        entityManager.flush();
        RecipeCollection retrieved = collectionService.findById(savedCollection.getId()).orElse(null);
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getTitle()).isEqualTo("My Collection");
    }
}
