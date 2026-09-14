package com.example.demo.repository;

import com.example.demo.model.OtpToken;
import com.example.demo.model.OtpToken.OtpType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, String> {

    Optional<OtpToken> findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(String email, OtpType type);

    List<OtpToken> findByEmailAndTypeAndUsedFalse(String email, OtpType type);

    long countByEmailAndTypeAndCreatedAtAfter(String email, OtpType type, Instant after);

    void deleteByExpiryTimeBefore(Instant now);
}
