package com.example.demo;

import com.example.demo.controller.AuthController;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.SignupRequest;
import com.example.demo.model.OtpToken.OtpType;
import com.example.demo.model.User;
import com.example.demo.repository.OtpTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailService;
import com.example.demo.service.OtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AuthFlowTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OtpTokenRepository otpTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private OtpService otpService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testFreshSignupUnverifiedState() {
        SignupRequest request = new SignupRequest();
        request.setFullName("Test User");
        request.setEmail("fresh@example.com");
        request.setUsername("freshuser");
        request.setPassword("password123");

        when(userRepository.findByEmail("fresh@example.com")).thenReturn(Optional.empty());
        when(userRepository.existsByUsername("freshuser")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        ResponseEntity<?> response = authController.registerUser(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userRepository).save(argThat(user -> 
            user.getEmail().equals("fresh@example.com") && 
            Boolean.FALSE.equals(user.getEmailVerified())
        ));
        verify(otpService).generateAndSendOtp("fresh@example.com", OtpType.EMAIL_VERIFICATION);
    }

    @Test
    void testSignupRetryForUnverifiedUserAllowsRetryAndSendsNewOtp() {
        User unverifiedUser = User.builder()
                .id("123")
                .email("pending@example.com")
                .username("pendinguser")
                .password("oldEncodedPassword")
                .emailVerified(false)
                .build();

        SignupRequest request = new SignupRequest();
        request.setFullName("Updated Pending User");
        request.setEmail("pending@example.com");
        request.setUsername("pendinguser");
        request.setPassword("newPassword123");

        when(userRepository.findByEmail("pending@example.com")).thenReturn(Optional.of(unverifiedUser));

        ResponseEntity<?> response = authController.registerUser(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userRepository).save(argThat(user -> 
            user.getEmail().equals("pending@example.com") && 
            Boolean.FALSE.equals(user.getEmailVerified())
        ));
        verify(otpService).generateAndSendOtp("pending@example.com", OtpType.EMAIL_VERIFICATION);
    }

    @Test
    void testSignupRetryForVerifiedUserIsRejected() {
        User verifiedUser = User.builder()
                .id("456")
                .email("verified@example.com")
                .username("verifieduser")
                .password("encodedPassword")
                .emailVerified(true)
                .build();

        SignupRequest request = new SignupRequest();
        request.setFullName("Verified User");
        request.setEmail("verified@example.com");
        request.setUsername("verifieduser");
        request.setPassword("password123");

        when(userRepository.findByEmail("verified@example.com")).thenReturn(Optional.of(verifiedUser));

        ResponseEntity<?> response = authController.registerUser(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(otpService, never()).generateAndSendOtp(anyString(), any());
    }

    @Test
    void testLoginRejectedForUnverifiedUser() {
        User unverifiedUser = User.builder()
                .id("123")
                .email("unverified@example.com")
                .username("unverifieduser")
                .password("encodedPassword")
                .emailVerified(false)
                .build();

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("unverifieduser");
        loginRequest.setPassword("password123");

        UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(unverifiedUser, "password123", unverifiedUser.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(authToken);

        ResponseEntity<?> response = authController.authenticateUser(loginRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("verify your email"));
    }

    @Test
    void testEmailSendingFailureReturnsErrorResponse() {
        SignupRequest request = new SignupRequest();
        request.setFullName("Fail User");
        request.setEmail("fail@example.com");
        request.setUsername("failuser");
        request.setPassword("password123");

        when(userRepository.findByEmail("fail@example.com")).thenReturn(Optional.empty());
        when(userRepository.existsByUsername("failuser")).thenReturn(false);
        doThrow(new RuntimeException("SMTP Connection Error"))
                .when(otpService).generateAndSendOtp("fail@example.com", OtpType.EMAIL_VERIFICATION);

        ResponseEntity<?> response = authController.registerUser(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Unable to send verification email"));
        // Ensure no user was created or saved in the database when email delivery failed!
        verify(userRepository, never()).save(any());
    }
}
