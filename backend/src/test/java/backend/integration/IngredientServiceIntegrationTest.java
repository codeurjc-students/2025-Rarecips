package backend.integration;

import com.blasetvrtumi.rarecips.repository.IngredientRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import static org.assertj.core.api.Assertions.assertThat;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.entity.Ingredient;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.Optional;

@SpringBootTest(classes = RarecipsApplication.class)
@ActiveProfiles("test")
@Transactional
public class IngredientServiceIntegrationTest {

    @Autowired
    private IngredientRepository ingredientRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void shouldCreateAndRetrieveIngredient() {
        Ingredient ingredient = new Ingredient("Tomato", "image.png", "base64string");
        Ingredient savedIngredient = ingredientRepository.save(ingredient);
        entityManager.flush();
        Optional<Ingredient> retrieved = ingredientRepository.findById(savedIngredient.getId());
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.get().getFood()).isEqualTo("Tomato");
    }
}
