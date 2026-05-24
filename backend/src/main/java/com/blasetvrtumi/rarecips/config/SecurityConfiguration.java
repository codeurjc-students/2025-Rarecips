package com.blasetvrtumi.rarecips.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.blasetvrtumi.rarecips.security.RepositoryUserDetailService;
import com.blasetvrtumi.rarecips.security.jwt.JwtRequestFilter;

import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfiguration {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(RepositoryUserDetailService userDetailService,
                                                            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtRequestFilter jwtRequestFilter,
                                                   RepositoryUserDetailService userDetailService,
                                                   PasswordEncoder passwordEncoder) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authenticationProvider(authenticationProvider(userDetailService, passwordEncoder))
                .formLogin(formLogin -> formLogin.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**", "/api/v1/public/**", "/swagger-ui/**", "/v3/**").permitAll()
                        .requestMatchers("/notify/**", "/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/recipes/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/ingredients/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/reviews/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/enums/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/role").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/admin/system-status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/users/change-password").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/collections/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/activities/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/users/**").hasAnyRole("ADMIN", "USER")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/recipes/**").hasAnyRole("ADMIN", "USER")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/ingredients/**").hasAnyRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/ingredients/**").hasAnyRole("ADMIN")
                        .requestMatchers("/api/v1/collections/**").hasAnyRole("ADMIN", "USER")
                        .anyRequest().authenticated());

        return http.build();
    }
}