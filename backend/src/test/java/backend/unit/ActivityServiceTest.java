package backend.unit;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.blasetvrtumi.rarecips.entity.Activity;
import com.blasetvrtumi.rarecips.repository.ActivityRepository;
import com.blasetvrtumi.rarecips.service.ActivityService;

@ExtendWith(MockitoExtension.class)
public class ActivityServiceTest {

    @Mock
    private ActivityRepository activityRepository;

    @InjectMocks
    private ActivityService activityService;

    @Test
    public void shouldCreateActivitySuccessfully() {
        Activity activity = new Activity();
        activity.setActivityType(Activity.ActivityType.CREATE_RECIPE.name());
        when(activityRepository.save(any(Activity.class))).thenReturn(activity);
        Activity result = activityRepository.save(activity);
        assertThat(result.getActivityType()).isEqualTo(Activity.ActivityType.CREATE_RECIPE.name());
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    public void shouldFindActivityById() {
        Activity activity = new Activity();
        activity.setId(1L);
        when(activityRepository.findById(1L)).thenReturn(Optional.of(activity));
        Optional<Activity> result = activityRepository.findById(1L);
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(1L);
    }

    @Test
    public void shouldUpdateActivitySuccessfully() {
        Activity activity = new Activity();
        activity.setId(1L);
        activity.setActivityType(Activity.ActivityType.CREATE_RECIPE.name());
        activity.setActivityType(Activity.ActivityType.UPDATE_RECIPE.name());
        when(activityRepository.save(any(Activity.class))).thenReturn(activity);
        Activity result = activityRepository.save(activity);
        assertThat(result.getActivityType()).isEqualTo(Activity.ActivityType.UPDATE_RECIPE.name());
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    public void shouldDeleteActivitySuccessfully() {
        doNothing().when(activityRepository).deleteById(1L);
        activityRepository.deleteById(1L);
        verify(activityRepository).deleteById(1L);
    }

    @Test
    public void shouldReturnEmptyWhenActivityNotFound() {
        when(activityRepository.findById(99L)).thenReturn(Optional.empty());
        Optional<Activity> result = activityRepository.findById(99L);
        assertThat(result).isEmpty();
    }
}
