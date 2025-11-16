package com.blasetvrtumi.rarecips.security;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import com.blasetvrtumi.rarecips.service.ImageService;

@Service
public class RepositoryUserDetailService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    @Lazy
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ImageService imageService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        User user = userRepository.findByUsername(username);

        if (user == null) {
            throw new UsernameNotFoundException("Username " + username + " not found");
        }

        List<GrantedAuthority> roles = new ArrayList<>();
        roles.add(new SimpleGrantedAuthority("ROLE_" + (user.getRole() != null ? user.getRole() : "USER")));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                roles);

    }

    public UserDetails createUser(String username, String email, String password) {
        User newUser = new User();
        newUser.setUsername(username);
        newUser.setDisplayName(username);
        newUser.setEmail(email);
        newUser.setPassword(passwordEncoder.encode(password));
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setProfileImageFile(imageService.localImageToBlob("static/assets/img/user.png"));
        newUser.setProfileImageString(imageService.blobToString(newUser.getProfileImageFile()));
        userRepository.save(newUser);
        return loadUserByUsername(username);
    }

}
