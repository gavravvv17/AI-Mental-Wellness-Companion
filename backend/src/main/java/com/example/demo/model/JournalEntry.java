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

@Document(collection = "journal_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntry {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private LocalDate date;

    private String title;
    
    private String content; // private sensitive data, encrypted or plain for ease of text analytics

    // Speech-to-Text audio transcript helpers
    private String voiceUrl;

    // AI Analysis fields
    private String summary;
    private double sentimentScore; // Scale from -1.0 (very negative/distressed) to 1.0 (very positive)
    private List<String> themes; // e.g. ["work pressure", "gratitude", "loneliness"]
    private List<String> reflectionQuestions;
    private List<String> copingStrategies;
    
    // Safety flag for wellness checks
    private boolean safetyAlertTriggered;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
