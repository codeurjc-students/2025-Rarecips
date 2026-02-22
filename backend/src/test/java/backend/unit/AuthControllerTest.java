package backend.unit;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.blasetvrtumi.rarecips.controller.AuthController;
import com.blasetvrtumi.rarecips.security.jwt.AuthRequest;
import com.blasetvrtumi.rarecips.security.jwt.AuthResponse;
import com.blasetvrtumi.rarecips.security.jwt.AuthService;
import com.blasetvrtumi.rarecips.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthController authController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    public void shouldLoginSuccessfully() throws Exception {
        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password");

        AuthResponse authResponse = new AuthResponse(AuthResponse.Status.SUCCESS, "Success");
        when(authService.login(any(), any(), any())).thenReturn(ResponseEntity.ok(authResponse));

        mockMvc.perform(put("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")));
    }

    @Test
    public void shouldSignupSuccessfully() throws Exception {
        AuthRequest signupRequest = new AuthRequest();
        signupRequest.setUsername("newuser");
        signupRequest.setEmail("new@example.com");
        signupRequest.setPassword("Password123!");

        when(userService.existsByUsername("newuser")).thenReturn(false);
        when(userService.existsByEmail("new@example.com")).thenReturn(false);
        
        AuthResponse authResponse = new AuthResponse(AuthResponse.Status.SUCCESS, "User registered");
        when(authService.signup(any())).thenReturn(ResponseEntity.ok(authResponse));

        mockMvc.perform(put("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUCCESS")));
    }

    @Test
    public void shouldFailSignupWhenUserExists() throws Exception {
        AuthRequest signupRequest = new AuthRequest();
        signupRequest.setUsername("existinguser");
        signupRequest.setEmail("new@example.com");
        signupRequest.setPassword("Password123!");

        when(userService.existsByUsername("existinguser")).thenReturn(true);

        mockMvc.perform(put("/api/v1/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is("FAILURE")))
                .andExpect(jsonPath("$.message", is("Username already taken")));
    }
}
