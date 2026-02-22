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
import com.blasetvrtumi.rarecips.repository.RecipeCollectionRepository;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.service.ActivityService;
import com.blasetvrtumi.rarecips.service.RecipeService;

@ExtendWith(MockitoExtension.class)
public class RecipeServiceTest {

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityService activityService;

    @Mock
    private RecipeCollectionRepository recipeCollectionRepository;

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

    @Test
    public void shouldUpdateRecipeSuccessfully() {
        User author = createMockUser();
        Recipe recipe = createMockRecipe(author);
        recipe.setId(1L);
        when(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe));
        recipe.setLabel("Updated Spaghetti");
        when(recipeRepository.save(any(Recipe.class))).thenReturn(recipe);
        Recipe result = recipeService.updateRecipe(1L, recipe, author.getUsername());
        assertThat(result.getLabel()).isEqualTo("Updated Spaghetti");
        verify(recipeRepository).save(any(Recipe.class));
    }

    @Test
    public void shouldDeleteRecipeSuccessfully() {
        User author = createMockUser();
        Recipe recipe = createMockRecipe(author);
        when(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe));
        when(recipeCollectionRepository.findAll()).thenReturn(new ArrayList<>());
        doNothing().when(recipeRepository).delete(any(Recipe.class));
        recipeService.deleteRecipe(1L, author.getUsername());
        verify(recipeRepository).delete(any(Recipe.class));
    }

    @Test
    public void shouldFindRecipeByIdSuccessfully() {
        User author = createMockUser();
        Recipe recipe = createMockRecipe(author);
        when(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe));
        Recipe result = recipeService.findById(1L);
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getLabel()).isEqualTo("Test Recipe");
        verify(recipeRepository).findById(1L);
    }

    @Test
    public void shouldThrowExceptionWhenRecipeNotFound() {
        when(recipeRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> recipeService.findById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Recipe not found");
    }

    private User createMockUser() {
        return new User(
                "testuser",           // username
                "password",           // password
                "test@example.com",   // email
                null,                 // profilePicture (Blob)
                "Test User",          // displayName
                "Test description",   // description
                "Test Bio"            // bio
        );
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