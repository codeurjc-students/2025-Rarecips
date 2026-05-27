package backend.unit;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

import java.util.Optional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.blasetvrtumi.rarecips.repository.RecipeCollectionRepository;
import com.blasetvrtumi.rarecips.repository.RecipeRepository;
import com.blasetvrtumi.rarecips.repository.ReviewRepository;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private RecipeCollectionRepository collectionRepository;

    @InjectMocks
    private UserService userService;

    @Test
    public void shouldCreateUserSuccessfully() {
        User user = new User("testuser", "password", "test@example.com", "Test User", "desc", "bio");
        when(userRepository.save(any(User.class))).thenReturn(user);
        User result = userService.save(user);
        assertThat(result.getUsername()).isEqualTo("testuser");
        verify(userRepository).save(any(User.class));
    }

    @Test
    public void shouldFindUserByUsername() {
        User user = new User("testuser", "password", "test@example.com", "Test User", "desc", "bio");
        when(userRepository.findByUsername("testuser")).thenReturn(user);
        User result = userService.findByUsername("testuser");
        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo("testuser");
    }

    @Test
    public void shouldUpdateUserSuccessfully() {
        User user = new User("testuser", "password", "test@example.com", "Test User", "desc", "bio");

        Authentication auth = new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword());
        SecurityContextHolder.getContext().setAuthentication(auth);

        user.setDisplayName("Updated User");
        when(userRepository.save(any(User.class))).thenReturn(user);
        User result = userService.save(user);
        assertThat(result.getDisplayName()).isEqualTo("Updated User");
        verify(userRepository).save(any(User.class));
    }

    @Test
    public void shouldDeleteUserSuccessfully() {
        doNothing().when(userRepository).deleteById(1L);
        userRepository.deleteById(1L);
        verify(userRepository).deleteById(1L);
    }

    @Test
    public void shouldReturnNullWhenUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        User result = userService.findById(99L);
        assertThat(result).isNull();
    }

    @Test
    public void shouldGetUsersByRole() {
        User user = new User("admin", "pass", "admin@test.com", "Admin", "desc", "bio");
        user.setRole("ADMIN");
        Page<User> page = new PageImpl<>(java.util.Collections.singletonList(user));
        when(userRepository.findByRole(eq(User.Role.ADMIN), any(Pageable.class))).thenReturn(page);
        
        Page<User> result = userService.getUsersByRole(User.Role.ADMIN, 0, 10);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getRole()).isEqualTo("ADMIN");
    }

    @Test
    public void shouldGetFilteredUsersStatus() {
        User user = new User("suspended", "pass", "s@test.com", "Suspended", "desc", "bio");
        user.setSuspended(true);
        Page<User> page = new PageImpl<>(java.util.Collections.singletonList(user));
        when(userRepository.findByRoleNotAndSuspendedCustom(eq(User.Role.ADMIN), eq(true), any(Pageable.class))).thenReturn(page);

        Page<User> result = userService.getFilteredUsersStatus(true, 0, 10);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).isSuspended()).isTrue();
    }

    @Test
    public void shouldDeleteUserAndCascade() {
        User user = new User("todelete", "pass", "d@test.com", "Delete", "desc", "bio");
        when(userRepository.findByUsername("todelete")).thenReturn(user);
        when(collectionRepository.findByUser(user)).thenReturn(java.util.Collections.emptyList());
        when(recipeRepository.findByAuthor(user)).thenReturn(java.util.Collections.emptyList());
        when(reviewRepository.findByAuthor(user)).thenReturn(java.util.Collections.emptyList());

        userService.deleteUserAndCascade("todelete");

        verify(userRepository).delete(org.mockito.ArgumentMatchers.any(User.class));
    }
}
