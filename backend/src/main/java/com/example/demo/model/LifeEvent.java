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

@Document(collection = "life_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LifeEvent {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private LocalDate date;

    private String title; // e.g. "Final Exams", "New Job", "Moved to new city"
    private String description;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
