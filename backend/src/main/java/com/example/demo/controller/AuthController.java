package com.example.demo.controller;

import com.example.demo.dto.JwtResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.MessageResponse;
import com.example.demo.dto.SignupRequest;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtils;
import com.example.demo.service.InMemoryDatabase;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                Authentication authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                String jwt = jwtUtils.generateJwtToken(authentication);

                User userDetails = (User) authentication.getPrincipal();

                return ResponseEntity.ok(new JwtResponse(jwt,
                        userDetails.getId(),
                        userDetails.getUsername(),
                        userDetails.getEmail(),
                        userDetails.getFullName()));
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                return loginInMemory(loginRequest);
            }
        } else {
            return loginInMemory(loginRequest);
        }
    }

    private ResponseEntity<?> loginInMemory(LoginRequest loginRequest) {
        Optional<User> userOpt = InMemoryDatabase.users.stream()
                .filter(u -> u.getUsername().equals(loginRequest.getUsername()))
                .findFirst();

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (encoder.matches(loginRequest.getPassword(), user.getPassword())) {
                String token = "mock-jwt-token-for-" + user.getUsername();
                return ResponseEntity.ok(new JwtResponse(token,
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getFullName()));
            }
        }
        return ResponseEntity.status(401).body(new MessageResponse("Error: Invalid credentials (In-Memory Auth)"));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                if (userRepository.existsByUsername(signUpRequest.getUsername())) {
                    return ResponseEntity
                            .badRequest()
                            .body(new MessageResponse("Error: Username is already taken!"));
                }

                if (userRepository.existsByEmail(signUpRequest.getEmail())) {
                    return ResponseEntity
                            .badRequest()
                            .body(new MessageResponse("Error: Email is already in use!"));
                }

                User user = User.builder()
                        .username(signUpRequest.getUsername())
                        .email(signUpRequest.getEmail())
                        .password(encoder.encode(signUpRequest.getPassword()))
                        .fullName(signUpRequest.getFullName())
                        .build();

                userRepository.save(user);

                return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                return signupInMemory(signUpRequest);
            }
        } else {
            return signupInMemory(signUpRequest);
        }
    }

    private ResponseEntity<?> signupInMemory(SignupRequest signUpRequest) {
        boolean usernameExists = InMemoryDatabase.users.stream().anyMatch(u -> u.getUsername().equals(signUpRequest.getUsername()));
        if (usernameExists) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken (In-Memory)!"));
        }
        boolean emailExists = InMemoryDatabase.users.stream().anyMatch(u -> u.getEmail().equals(signUpRequest.getEmail()));
        if (emailExists) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use (In-Memory)!"));
        }

        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .fullName(signUpRequest.getFullName())
                .build();
        
        InMemoryDatabase.users.add(user);
        return ResponseEntity.ok(new MessageResponse("User registered successfully (In-Memory)!"));
    }
}

