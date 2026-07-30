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
@Table(name = "journal_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String content; // private sensitive data

    // Speech-to-Text audio transcript helpers
    private String voiceUrl;

    // AI Analysis fields
    @Column(columnDefinition = "TEXT")
    private String summary;
    
    private Double sentimentScore; // Scale from -1.0 to 1.0

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "journal_themes", joinColumns = @JoinColumn(name = "journal_entry_id"))
    @Column(name = "theme", columnDefinition = "TEXT")
    private List<String> themes; // e.g. ["work pressure", "gratitude", "loneliness"]

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "journal_reflections", joinColumns = @JoinColumn(name = "journal_entry_id"))
    @Column(name = "reflection_question", columnDefinition = "TEXT")
    private List<String> reflectionQuestions;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "journal_coping_strategies", joinColumns = @JoinColumn(name = "journal_entry_id"))
    @Column(name = "coping_strategy", columnDefinition = "TEXT")
    private List<String> copingStrategies;
    
    // Safety flag for wellness checks
    private Boolean safetyAlertTriggered;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public String getUserId() {
        return user != null ? user.getId() : null;
    }
}
