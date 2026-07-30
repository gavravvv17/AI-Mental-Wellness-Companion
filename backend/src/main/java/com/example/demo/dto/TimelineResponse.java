package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineResponse {
    private List<TimelineItem> items;
    private List<String> insights; // E.g., "Your average sleep was 7.5 hrs on happy days vs. 5.2 hrs on stressed days."

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineItem {
        private LocalDate date;
        
        // Mood details
        private String mood;
        private Integer energyLevel;
        private List<String> emotions;
        
        // Health metrics
        private Double sleepHours;
        private Integer exerciseMinutes;
        private Integer waterIntakeMl;
        
        // Journal details
        private String journalId;
        private String journalTitle;
        private String journalSummary;
        private Double journalSentiment;
        private Boolean safetyAlertTriggered;
        
        // Life events details
        private String lifeEventId;
        private String lifeEventTitle;
        private String lifeEventDescription;
        
        // Habits completed on this day
        private List<String> completedHabits;
    }
}
