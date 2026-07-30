package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "mood_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoodLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    private String mood; // e.g. Happy, Stressed, Anxious, Calm, Sad, Energetic

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "mood_log_emotions", joinColumns = @JoinColumn(name = "mood_log_id"))
    @Column(name = "emotion")
    private List<String> emotions; // e.g. ["burnout", "tired", "excited"]

    private int energyLevel; // 1 to 10

    @Column(columnDefinition = "TEXT")
    private String note;

    // Daily health metrics for correlation charts
    private double sleepHours;
    private int exerciseMinutes;
    private int waterIntakeMl;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public String getUserId() {
        return user != null ? user.getId() : null;
    }
}
