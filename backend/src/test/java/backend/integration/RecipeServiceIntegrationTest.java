package backend.integration;

import java.util.ArrayList;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

import com.blasetvrtumi.rarecips.RarecipsApplication;
import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.service.RecipeService;
import com.blasetvrtumi.rarecips.service.UserService;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

@SpringBootTest(classes = RarecipsApplication.class)
@ActiveProfiles("test")
@Transactional
public class RecipeServiceIntegrationTest {

    @Autowired
    private RecipeService recipeService;

    @Autowired
    private UserService userService;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void shouldCreateAndRetrieveRecipe() {
        User user = new User(
                "integrationUser",
                "password",
                "integration@example.com",
                null,
                "Integration User",
                "Integration test user",
                "Test Bio"
        );

        User savedUser = userService.save(user);
        entityManager.flush();

        Recipe recipe = new Recipe(
                "Test Recipe",        // label
                "Test Description",   // description
                new ArrayList<>(),    // ingredients
                new ArrayList<>(),    // steps
                new ArrayList<>(),    // dietLabels
                4,                    // people
                new ArrayList<>(),    // healthLabels
                1,                    // difficulty
                new ArrayList<>(),    // cautions
                new ArrayList<>(),    // dishTypes
                new ArrayList<>(),    // mealTypes
                30.0f,               // totalTime
                500.0f,              // totalWeight
                400.0f,              // calories
                savedUser,           // author
                new ArrayList<>()    // cuisineType
        );

        Recipe createdRecipe = recipeService.createRecipe(recipe, savedUser.getUsername());
        entityManager.flush();

        Recipe retrievedRecipe = recipeService.findById(createdRecipe.getId());

        assertThat(retrievedRecipe).isNotNull();
        assertThat(retrievedRecipe.getLabel()).isEqualTo("Test Recipe");
        assertThat(retrievedRecipe.getDescription()).isEqualTo("Test Description");
        assertThat(retrievedRecipe.getAuthor()).isEqualTo("integrationUser");
    }
}