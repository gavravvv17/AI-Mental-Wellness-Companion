package com.example.demo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Document(collection = "mood_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoodLog {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private LocalDate date;

    private String mood; // e.g. Happy, Stressed, Anxious, Calm, Sad, Energetic
    private List<String> emotions; // e.g. ["burnout", "tired", "excited"]
    private int energyLevel; // 1 to 10
    private String note;

    // Daily health metrics for correlation charts
    private double sleepHours;
    private int exerciseMinutes;
    private int waterIntakeMl;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
