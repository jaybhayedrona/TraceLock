package com.tracevault.controller;

import com.tracevault.entity.User;
import com.tracevault.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getEmail() == null || request.getPassword() == null || request.getName() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, email, and password are required."));
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match."));
        }

        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "An account with this email already exists."));
        }

        User user = User.builder()
                .id("usr_" + UUID.randomUUID().toString().replace("-", ""))
                .fullName(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_USER")
                .isActive(true)
                .build();

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "User registered successfully.",
                "userId", user.getId(),
                "email", user.getEmail()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials."));
        }

        return ResponseEntity.ok(Map.of(
                "token", user.getId(),
                "user", Map.of("id", user.getId(), "name", user.getFullName(), "email", user.getEmail(), "role", user.getRole())
        ));
    }

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String confirmPassword;
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }
}
