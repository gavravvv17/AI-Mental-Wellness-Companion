package com.example.demo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "otp_tokens", indexes = {
    @Index(name = "idx_otp_email_type", columnList = "email, type")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpToken {

    public enum OtpType {
        EMAIL_VERIFICATION,
        PASSWORD_RESET
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String email;

    @Column(name = "otp_hash", nullable = false)
    private String otpHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OtpType type;

    @Column(name = "expiry_time", nullable = false)
    private Instant expiryTime;

    @Column(nullable = false)
    @Builder.Default
    private boolean used = false;

    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(name = "resend_cooldown_until")
    private Instant resendCooldownUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
