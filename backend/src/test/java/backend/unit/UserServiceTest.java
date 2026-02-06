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

import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.service.UserService;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    public void shouldCreateUserSuccessfully() {
        User user = new User("testuser", "password", "test@example.com", null, "Test User", "desc", "bio");
        when(userRepository.save(any(User.class))).thenReturn(user);
        User result = userService.save(user);
        assertThat(result.getUsername()).isEqualTo("testuser");
        verify(userRepository).save(any(User.class));
    }

    @Test
    public void shouldFindUserByUsername() {
        User user = new User("testuser", "password", "test@example.com", null, "Test User", "desc", "bio");
        when(userRepository.findByUsername("testuser")).thenReturn(user);
        User result = userService.findByUsername("testuser");
        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo("testuser");
    }

    @Test
    public void shouldUpdateUserSuccessfully() {
        User user = new User("testuser", "password", "test@example.com", null, "Test User", "desc", "bio");

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
}
