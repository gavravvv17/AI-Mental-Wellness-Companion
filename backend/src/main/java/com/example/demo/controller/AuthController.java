package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.model.OtpToken.OtpType;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtils;
import com.example.demo.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

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

    @Autowired
    private OtpService otpService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid username or password."));
        }

        User userDetails = (User) authentication.getPrincipal();

        if (Boolean.FALSE.equals(userDetails.getEmailVerified())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Please verify your email before logging in."));
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getFullName()));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        String requestedEmail = signUpRequest.getEmail() != null ? signUpRequest.getEmail().trim().toLowerCase() : "";
        Optional<User> existingEmailUser = userRepository.findByEmail(requestedEmail);

        if (existingEmailUser.isPresent()) {
            User existingUser = existingEmailUser.get();
            if (Boolean.TRUE.equals(existingUser.getEmailVerified())) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("This email is already registered. Please log in or use Forgot Password."));
            } else {
                // Email belongs to an UNVERIFIED / PENDING account. Attempt OTP send BEFORE modifying record.
                String requestedUsername = (signUpRequest.getUsername() != null && !signUpRequest.getUsername().isBlank())
                        ? signUpRequest.getUsername().trim()
                        : requestedEmail;

                if (!requestedUsername.equalsIgnoreCase(existingUser.getUsername()) && userRepository.existsByUsername(requestedUsername)) {
                    return ResponseEntity
                            .badRequest()
                            .body(new MessageResponse("Error: Username is already taken!"));
                }

                // Send OTP first. If email fails, catch exception without updating account credentials.
                try {
                    otpService.generateAndSendOtp(requestedEmail, OtpType.EMAIL_VERIFICATION);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(new MessageResponse("Unable to send verification email. Please check server SMTP credentials or try again later. (" + e.getMessage() + ")"));
                }

                existingUser.setUsername(requestedUsername);
                existingUser.setPassword(encoder.encode(signUpRequest.getPassword()));
                if (signUpRequest.getFullName() != null && !signUpRequest.getFullName().isBlank()) {
                    existingUser.setFullName(signUpRequest.getFullName().trim());
                }
                userRepository.save(existingUser);

                return ResponseEntity.ok(new MessageResponse("Verification code sent to your email. Please enter the OTP to activate your account."));
            }
        }

        // Fresh email registration
        String requestedUsername = (signUpRequest.getUsername() != null && !signUpRequest.getUsername().isBlank())
                ? signUpRequest.getUsername().trim()
                : requestedEmail;

        if (userRepository.existsByUsername(requestedUsername)) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        // Send OTP FIRST via SMTP! If email fails, DO NOT save User to DB!
        try {
            otpService.generateAndSendOtp(requestedEmail, OtpType.EMAIL_VERIFICATION);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Unable to send verification email. Please check server SMTP credentials or try again later. (" + e.getMessage() + ")"));
        }

        // Email was successfully sent! Now create and save the unverified User entity.
        try {
            User user = User.builder()
                    .username(requestedUsername)
                    .email(requestedEmail)
                    .password(encoder.encode(signUpRequest.getPassword()))
                    .fullName(signUpRequest.getFullName() != null ? signUpRequest.getFullName().trim() : null)
                    .emailVerified(false)
                    .build();

            userRepository.save(user);

            return ResponseEntity.ok(new MessageResponse("Verification code sent to your email. Please enter the OTP to activate your account."));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("This email is already registered. Please log in or use Forgot Password."));
        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Failed to complete signup: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest verifyRequest) {
        try {
            OtpType type = verifyRequest.getType() != null ? verifyRequest.getType() : OtpType.EMAIL_VERIFICATION;
            boolean verified = otpService.verifyOtp(verifyRequest.getEmail().trim().toLowerCase(), verifyRequest.getOtp().trim(), type);

            if (verified && type == OtpType.EMAIL_VERIFICATION) {
                Optional<User> userOpt = userRepository.findByEmail(verifyRequest.getEmail().trim().toLowerCase());
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    user.setEmailVerified(true);
                    userRepository.save(user);
                }
                return ResponseEntity.ok(new MessageResponse("Email verified successfully! You can now log in."));
            } else if (verified) {
                return ResponseEntity.ok(new MessageResponse("OTP verified successfully."));
            }

            return ResponseEntity.badRequest().body(new MessageResponse("Invalid verification code."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new MessageResponse("Verification failed. Please try again."));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody ResendOtpRequest resendRequest) {
        try {
            String targetEmail = resendRequest.getEmail().trim().toLowerCase();
            OtpType type = resendRequest.getType() != null ? resendRequest.getType() : OtpType.EMAIL_VERIFICATION;
            
            if (type == OtpType.EMAIL_VERIFICATION) {
                Optional<User> userOpt = userRepository.findByEmail(targetEmail);
                if (userOpt.isEmpty()) {
                    return ResponseEntity.badRequest().body(new MessageResponse("No account found for this email address. Please sign up first."));
                }
                if (Boolean.TRUE.equals(userOpt.get().getEmailVerified())) {
                    return ResponseEntity.badRequest().body(new MessageResponse("This email is already verified. Please log in."));
                }
            }

            otpService.generateAndSendOtp(targetEmail, type);
            return ResponseEntity.ok(new MessageResponse("A new verification code has been sent to your email."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to resend code: " + e.getMessage()));
        }
    }    @PostMapping("/test-email")
    public ResponseEntity<?> testEmail(@RequestParam(required = false, defaultValue = "test@example.com") String to) {
        try {
            boolean sent = otpService.generateAndSendOtp(to.trim(), OtpType.EMAIL_VERIFICATION) != null;
            return ResponseEntity.ok(new MessageResponse("Development test email successfully sent to " + to));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("SMTP Test Failed: " + e.getMessage()));
        }
    }


    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isPresent()) {
                otpService.generateAndSendOtp(request.getEmail(), OtpType.PASSWORD_RESET);
            }
            // Safe response for privacy
            return ResponseEntity.ok(new MessageResponse("If this email is registered, a password reset code has been sent."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new MessageResponse("Unable to process request. Please try again."));
        }
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<?> verifyResetOtp(@Valid @RequestBody VerifyOtpRequest verifyRequest) {
        try {
            // Verify code correctness without marking as used yet (so reset-password step can consume it)
            otpService.verifyOtp(verifyRequest.getEmail(), verifyRequest.getOtp(), OtpType.PASSWORD_RESET, false);
            return ResponseEntity.ok(new MessageResponse("Reset code verified successfully. Please enter your new password."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new MessageResponse("Verification failed. Please try again."));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("User not found for this email address."));
            }

            if (request.getOtp() == null || request.getOtp().isBlank()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Verification code is required."));
            }

            // Verify and mark OTP token as used
            otpService.verifyOtp(request.getEmail(), request.getOtp(), OtpType.PASSWORD_RESET, true);

            User user = userOpt.get();
            user.setPassword(encoder.encode(request.getNewPassword()));
            userRepository.save(user);

            return ResponseEntity.ok(new MessageResponse("Your password has been reset successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new MessageResponse("Failed to reset password. Please try again."));
        }
    }
}
