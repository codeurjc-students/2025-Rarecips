package backend.unit;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.blasetvrtumi.rarecips.entity.Ingredient;
import com.blasetvrtumi.rarecips.repository.IngredientRepository;

@ExtendWith(MockitoExtension.class)
public class IngredientRepositoryTest {

    @Mock
    private IngredientRepository ingredientRepository;

    @Test
    public void shouldCreateIngredientSuccessfully() {
        Ingredient ingredient = new Ingredient("Tomato", "", "");
        when(ingredientRepository.save(any(Ingredient.class))).thenReturn(ingredient);
        Ingredient result = ingredientRepository.save(ingredient);
        assertThat(result.getFood()).isEqualTo("Tomato");
        verify(ingredientRepository).save(any(Ingredient.class));
    }

    @Test
    public void shouldFindIngredientById() {
        Ingredient ingredient = new Ingredient("Tomato", "", "");
        when(ingredientRepository.findById(1L)).thenReturn(Optional.of(ingredient));
        Optional<Ingredient> result = ingredientRepository.findById(1L);
        assertThat(result).isPresent();
        assertThat(result.get().getFood()).isEqualTo("Tomato");
    }

    @Test
    public void shouldUpdateIngredientSuccessfully() {
        Ingredient ingredient = new Ingredient("Tomato", "", "");
        ingredient.setFood("Updated Tomato");
        when(ingredientRepository.save(any(Ingredient.class))).thenReturn(ingredient);
        Ingredient result = ingredientRepository.save(ingredient);
        assertThat(result.getFood()).isEqualTo("Updated Tomato");
        verify(ingredientRepository).save(any(Ingredient.class));
    }

    @Test
    public void shouldDeleteIngredientSuccessfully() {
        doNothing().when(ingredientRepository).deleteById(1L);
        ingredientRepository.deleteById(1L);
        verify(ingredientRepository).deleteById(1L);
    }

    @Test
    public void shouldReturnEmptyWhenIngredientNotFound() {
        when(ingredientRepository.findById(99L)).thenReturn(Optional.empty());
        Optional<Ingredient> result = ingredientRepository.findById(99L);
        assertThat(result).isEmpty();
    }
}
