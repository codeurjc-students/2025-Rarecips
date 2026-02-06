package backend.unit;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

import java.util.Optional;
import java.util.ArrayList;

import com.blasetvrtumi.rarecips.repository.RecipeCollectionRepository;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.service.ActivityService;
import com.blasetvrtumi.rarecips.service.RecipeCollectionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.blasetvrtumi.rarecips.entity.RecipeCollection;
import com.blasetvrtumi.rarecips.entity.User;

@ExtendWith(MockitoExtension.class)
public class CollectionServiceTest {
    @Mock
    private RecipeCollectionRepository collectionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ActivityService activityService;
    @InjectMocks
    private RecipeCollectionService collectionService;

    @Test
    public void shouldCreateCollectionSuccessfully() {
        User user = new User();
        user.setUsername("testuser");
        RecipeCollection collection = new RecipeCollection("My Collection", user, false);
        when(userRepository.findByUsername("testuser")).thenReturn(user);
        when(collectionRepository.save(any(RecipeCollection.class))).thenReturn(collection);
        RecipeCollection result = collectionService.createCollection("testuser", "My Collection", false);
        assertThat(result.getTitle()).isEqualTo("My Collection");
        verify(collectionRepository).save(any(RecipeCollection.class));
    }

    @Test
    public void shouldUpdateCollectionSuccessfully() {
        User user = new User();
        RecipeCollection collection = new RecipeCollection("My Collection", user, false);
        collection.setId(1L);
        when(collectionRepository.findById(1L)).thenReturn(Optional.of(collection));
        collection.setTitle("Updated Collection");
        when(collectionRepository.save(any(RecipeCollection.class))).thenReturn(collection);
        RecipeCollection result = collectionService.updateCollectionTitle(1L, "Updated Collection");
        assertThat(result.getTitle()).isEqualTo("Updated Collection");
        verify(collectionRepository).save(any(RecipeCollection.class));
    }

    @Test
    public void shouldDeleteCollectionSuccessfully() {
        RecipeCollection collection = new RecipeCollection("My Collection", new User(), false);
        collection.setId(1L);
        when(collectionRepository.findById(1L)).thenReturn(Optional.of(collection));
        doNothing().when(collectionRepository).delete(any(RecipeCollection.class));
        collectionService.deleteCollection(1L);
        verify(collectionRepository).delete(any(RecipeCollection.class));
    }

    @Test
    public void shouldFindCollectionById() {
        RecipeCollection collection = new RecipeCollection("My Collection", new User(), false);
        collection.setId(1L);
        when(collectionRepository.findById(1L)).thenReturn(Optional.of(collection));
        Optional<RecipeCollection> result = collectionService.findById(1L);
        assertThat(result).isPresent();
        assertThat(result.get().getTitle()).isEqualTo("My Collection");
    }

    @Test
    public void shouldReturnEmptyWhenCollectionNotFound() {
        when(collectionRepository.findById(99L)).thenReturn(Optional.empty());
        Optional<RecipeCollection> result = collectionService.findById(99L);
        assertThat(result).isEmpty();
    }
}
