package backend.unit;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.security.RepositoryUserDetailService;
import com.blasetvrtumi.rarecips.security.jwt.*;
import com.blasetvrtumi.rarecips.service.MailService;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RepositoryUserDetailService userDetailsService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private JwtCookieManager cookieUtil;

    @Mock
    private MailService mailService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    @Test
    public void shouldSignupSuccessfully() {
        // Given
        AuthRequest signupRequest = new AuthRequest();
        signupRequest.setUsername("testuser");
        signupRequest.setEmail("test@example.com");
        signupRequest.setPassword("Password123!");
        Map<String, String> preferences = new HashMap<>();
        preferences.put("baseUrl", "http://localhost");
        preferences.put("lang", "es");
        preferences.put("theme", "light");
        signupRequest.setPreferences(preferences);

        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");

        when(userDetailsService.createUser(anyString(), anyString(), anyString())).thenReturn(mock(UserDetails.class));
        when(userRepository.findByUsername("testuser")).thenReturn(user);

        // When
        ResponseEntity<AuthResponse> response = authService.signup(signupRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getStatus()).isEqualTo(AuthResponse.Status.SUCCESS);
        verify(userDetailsService).createUser(eq("testuser"), eq("test@example.com"), eq("Password123!"));
        verify(mailService).sendWelcomeEmail(anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    public void shouldFailSignupOnException() {
        // Given
        AuthRequest signupRequest = new AuthRequest();
        signupRequest.setUsername("testuser");
        
        when(userDetailsService.createUser(anyString(), anyString(), anyString())).thenThrow(new RuntimeException("Error"));

        // When
        ResponseEntity<AuthResponse> response = authService.signup(signupRequest);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getStatus()).isEqualTo(AuthResponse.Status.FAILURE);
    }
}
