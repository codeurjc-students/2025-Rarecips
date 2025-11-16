package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User save(User user) {
        return userRepository.save(user);
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public String[] getAllUsernames() {
        return userRepository.findAll().stream()
                .map(User::getUsername)
                .toArray(String[]::new);
    }

    public String[] getAllEmails() {
        return userRepository.findAll().stream()
                .map(User::getEmail)
                .toArray(String[]::new);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

}