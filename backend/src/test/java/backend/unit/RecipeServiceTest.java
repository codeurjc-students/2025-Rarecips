package backend.unit;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

import java.util.ArrayList;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.service.RecipeService;

@ExtendWith(MockitoExtension.class)
public class RecipeServiceTest {

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RecipeService recipeService;

    @Test
    public void shouldCreateRecipeSuccessfully() {
        // Given
        User author = createMockUser();
        Recipe recipe = createMockRecipe(author);

        when(userRepository.findByUsername(author.getUsername())).thenReturn(author);
        when(recipeRepository.save(any(Recipe.class))).thenReturn(recipe);

        // When
        Recipe result = recipeService.createRecipe(recipe, author.getUsername());

        // Then
        assertThat(result.getLabel()).isEqualTo(recipe.getLabel());
        verify(recipeRepository).save(any(Recipe.class));
        verify(userRepository).findByUsername(author.getUsername());
    }

    private User createMockUser() {
        // USAR EL CONSTRUCTOR EN LUGAR DE SETTERS
        User user = new User(
                "testuser",           // username
                "password",           // password
                "test@example.com",   // email
                null,                 // profilePicture (Blob)
                "Test User",          // displayName
                "Test description",   // description
                "Test Bio"            // bio
        );
        return user;
    }

    private Recipe createMockRecipe(User author) {
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
                author,              // author
                new ArrayList<>()    // cuisineType
        );
        recipe.setId(1L);
        return recipe;
    }
}