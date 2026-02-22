package backend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import static org.assertj.core.api.Assertions.assertThat;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.entity.Activity;
import com.blasetvrtumi.rarecips.repository.ActivityRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

@SpringBootTest(classes = RarecipsApplication.class)
@ActiveProfiles("test")
@Transactional
public class ActivityServiceIntegrationTest {

    @Autowired
    private ActivityRepository activityRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void shouldCreateAndRetrieveActivity() {
        Activity activity = new Activity();
        activity.setActivityType(Activity.ActivityType.CREATE_RECIPE.name());
        Activity savedActivity = activityRepository.save(activity);
        entityManager.flush();
        Activity retrieved = activityRepository.findById(savedActivity.getId()).orElse(null);
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getActivityType()).isEqualTo(Activity.ActivityType.CREATE_RECIPE.name());
    }
}
