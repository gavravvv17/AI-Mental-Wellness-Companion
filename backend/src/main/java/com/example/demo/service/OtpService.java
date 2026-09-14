package com.example.demo.service;

import com.example.demo.model.OtpToken;
import com.example.demo.model.OtpToken.OtpType;
import com.example.demo.repository.OtpTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class OtpService {

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int COOLDOWN_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;
    private static final int MAX_HOURLY_REQUESTS = 5;

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public String generateAndSendOtp(String email, OtpType type) {
        Instant now = Instant.now();

        // Check rate limiting: max 5 requests per email per hour
        Instant oneHourAgo = now.minus(1, ChronoUnit.HOURS);
        long requestCount = otpTokenRepository.countByEmailAndTypeAndCreatedAtAfter(email, type, oneHourAgo);
        if (requestCount >= MAX_HOURLY_REQUESTS) {
            throw new IllegalArgumentException("Too many OTP requests. Please wait an hour before requesting again.");
        }

        // Check resend cooldown from existing active token
        Optional<OtpToken> activeTokenOpt = otpTokenRepository.findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(email, type);
        if (activeTokenOpt.isPresent()) {
            OtpToken activeToken = activeTokenOpt.get();
            if (activeToken.getResendCooldownUntil() != null && activeToken.getResendCooldownUntil().isAfter(now)) {
                long remainingSeconds = ChronoUnit.SECONDS.between(now, activeToken.getResendCooldownUntil());
                throw new IllegalArgumentException("Please wait " + remainingSeconds + " seconds before requesting a new code.");
            }
        }

        // Invalidate all older unused tokens for this email and type
        List<OtpToken> existingTokens = otpTokenRepository.findByEmailAndTypeAndUsedFalse(email, type);
        if (!existingTokens.isEmpty()) {
            for (OtpToken token : existingTokens) {
                token.setUsed(true);
            }
            otpTokenRepository.saveAll(existingTokens);
        }

        // Generate 6-digit random OTP
        int rawOtpNum = 100000 + secureRandom.nextInt(900000);
        String rawOtp = String.valueOf(rawOtpNum);

        // Hash OTP before storing
        String otpHash = passwordEncoder.encode(rawOtp);

        OtpToken newToken = OtpToken.builder()
                .email(email)
                .otpHash(otpHash)
                .type(type)
                .expiryTime(now.plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES))
                .resendCooldownUntil(now.plus(COOLDOWN_SECONDS, ChronoUnit.SECONDS))
                .used(false)
                .attempts(0)
                .createdAt(now)
                .build();

        otpTokenRepository.save(newToken);

        // Send email based on OTP type
        if (type == OtpType.EMAIL_VERIFICATION) {
            emailService.sendVerificationOtpEmail(email, rawOtp);
        } else if (type == OtpType.PASSWORD_RESET) {
            emailService.sendPasswordResetOtpEmail(email, rawOtp);
        }

        return rawOtp;
    }

    @Transactional
    public boolean verifyOtp(String email, String rawOtp, OtpType type) {
        return verifyOtp(email, rawOtp, type, true);
    }

    @Transactional
    public boolean verifyOtp(String email, String rawOtp, OtpType type, boolean markAsUsed) {
        Instant now = Instant.now();
        Optional<OtpToken> tokenOpt = otpTokenRepository.findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(email, type);

        if (tokenOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid or expired verification code.");
        }

        OtpToken token = tokenOpt.get();

        if (token.getExpiryTime().isBefore(now)) {
            token.setUsed(true);
            otpTokenRepository.save(token);
            throw new IllegalArgumentException("Verification code has expired. Please request a new one.");
        }

        if (token.getAttempts() >= MAX_ATTEMPTS) {
            token.setUsed(true);
            otpTokenRepository.save(token);
            throw new IllegalArgumentException("Too many invalid attempts. This verification code is now invalid.");
        }

        if (!passwordEncoder.matches(rawOtp, token.getOtpHash())) {
            token.setAttempts(token.getAttempts() + 1);
            otpTokenRepository.save(token);
            throw new IllegalArgumentException("Invalid verification code. Please check and try again.");
        }

        if (markAsUsed) {
            token.setUsed(true);
            otpTokenRepository.save(token);
        }
        return true;
    }
}
