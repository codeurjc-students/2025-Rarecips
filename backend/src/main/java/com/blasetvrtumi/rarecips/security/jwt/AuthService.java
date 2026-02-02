package com.blasetvrtumi.rarecips.security.jwt;

import com.blasetvrtumi.rarecips.entity.Recipe;
import com.blasetvrtumi.rarecips.entity.User;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.blasetvrtumi.rarecips.security.RepositoryUserDetailService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.util.List;

@Service
public class AuthService {



    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RepositoryUserDetailService userDetailsService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private JwtCookieManager cookieUtil;

    @Autowired
    private com.blasetvrtumi.rarecips.service.MailService mailService;
    @Autowired
    private com.blasetvrtumi.rarecips.service.RecipeService recipeService;
    @Autowired
    private com.blasetvrtumi.rarecips.repository.UserRepository userRepository;

    public ResponseEntity<AuthResponse> login(AuthRequest authRequest, String encryptedAccessToken, String
            encryptedRefreshToken) {

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String accessToken = SecurityCipher.decrypt(encryptedAccessToken);
            String refreshToken = SecurityCipher.decrypt(encryptedRefreshToken);

            String username = authRequest.getUsername();
            UserDetails user = userDetailsService.loadUserByUsername(username);

            Boolean accessTokenValid = jwtTokenProvider.validateToken(accessToken);
            Boolean refreshTokenValid = jwtTokenProvider.validateToken(refreshToken);

            HttpHeaders responseHeaders = new HttpHeaders();
            Token newAccessToken;
            Token newRefreshToken;
            if (!accessTokenValid && !refreshTokenValid) {
                newAccessToken = jwtTokenProvider.generateToken(user);
                newRefreshToken = jwtTokenProvider.generateRefreshToken(user);
                addAccessTokenCookie(responseHeaders, newAccessToken);
                addRefreshTokenCookie(responseHeaders, newRefreshToken);
            }

            if (!accessTokenValid && refreshTokenValid) {
                newAccessToken = jwtTokenProvider.generateToken(user);
                addAccessTokenCookie(responseHeaders, newAccessToken);
            }

            if (accessTokenValid && refreshTokenValid) {
                newAccessToken = jwtTokenProvider.generateToken(user);
                newRefreshToken = jwtTokenProvider.generateRefreshToken(user);
                addAccessTokenCookie(responseHeaders, newAccessToken);
                addRefreshTokenCookie(responseHeaders, newRefreshToken);
            }

            AuthResponse loginResponse = new AuthResponse(AuthResponse.Status.SUCCESS,
                    "Auth successful. Tokens are created in cookie.");
            return ResponseEntity.ok().headers(responseHeaders).body(loginResponse);
        } catch (Exception e) {
            AuthResponse loginResponse = new AuthResponse(AuthResponse.Status.FAILURE,
                    "Invalid credentials !");
            return ResponseEntity.status(400).body(loginResponse);
        }
    }

    public ResponseEntity<AuthResponse> signup(AuthRequest signupRequest) {
        try {
            userDetailsService.createUser(signupRequest.getUsername(), signupRequest.getEmail(),
                    signupRequest.getPassword());

            User user = userRepository.findByUsername(signupRequest.getUsername());
            mailService.sendWelcomeEmail(user.getEmail(), signupRequest.getPreferences().get("baseUrl"), signupRequest.getPreferences().get("lang"), signupRequest.getPreferences().get("theme"), user.getUsername());

            AuthResponse signupResponse = new AuthResponse(AuthResponse.Status.SUCCESS,
                    "User registered successfully. You can now log in.");
            return ResponseEntity.ok().body(signupResponse);
        } catch (Exception e) {
            AuthResponse signupResponse = new AuthResponse(AuthResponse.Status.FAILURE,
                    "Registration failed: " + e.getMessage());
            return ResponseEntity.status(400).body(signupResponse);
        }
    }

    public ResponseEntity<AuthResponse> refresh(String encryptedRefreshToken) {

        String refreshToken = SecurityCipher.decrypt(encryptedRefreshToken);

        Boolean refreshTokenValid = jwtTokenProvider.validateToken(refreshToken);

        if (!refreshTokenValid) {
            AuthResponse loginResponse = new AuthResponse(AuthResponse.Status.FAILURE,
                    "Invalid refresh token !");
            return ResponseEntity.status(400).body(loginResponse);
        }

        String username = jwtTokenProvider.getUsername(refreshToken);
        UserDetails user = userDetailsService.loadUserByUsername(username);

        Token newAccessToken = jwtTokenProvider.generateToken(user);
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.add(HttpHeaders.SET_COOKIE, cookieUtil
                .createAccessTokenCookie(newAccessToken.getTokenValue(), newAccessToken.getDuration()).toString());

        AuthResponse loginResponse = new AuthResponse(AuthResponse.Status.SUCCESS,
                "Auth successful. Tokens are created in cookie.");
        return ResponseEntity.ok().headers(responseHeaders).body(loginResponse);
    }

    public String getUserName() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        return authentication.getName();
    }

    public String logout(HttpServletRequest request, HttpServletResponse response) {

        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                cookie.setMaxAge(0);
                cookie.setValue("");
                cookie.setHttpOnly(true);
                cookie.setPath("/");
                response.addCookie(cookie);
            }
        }
        return "Logout successful.";
    }

    private void addAccessTokenCookie(HttpHeaders httpHeaders, Token token) {
        httpHeaders.add(HttpHeaders.SET_COOKIE,
                cookieUtil.createAccessTokenCookie(token.getTokenValue(), token.getDuration()).toString());
    }

    private void addRefreshTokenCookie(HttpHeaders httpHeaders, Token token) {
        httpHeaders.add(HttpHeaders.SET_COOKIE,
                cookieUtil.createRefreshTokenCookie(token.getTokenValue(), token.getDuration()).toString());
    }

}
