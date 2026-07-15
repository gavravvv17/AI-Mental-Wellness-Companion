package com.example.demo.service;

import com.example.demo.model.*;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

public class InMemoryDatabase {
    public static volatile boolean isDatabaseOffline = false;
    
    public static final List<User> users = new CopyOnWriteArrayList<>();
    public static final List<MoodLog> moodLogs = new CopyOnWriteArrayList<>();
    public static final List<JournalEntry> journals = new CopyOnWriteArrayList<>();
    public static final List<HabitLog> habitLogs = new CopyOnWriteArrayList<>();
    public static final List<LifeEvent> lifeEvents = new CopyOnWriteArrayList<>();
    public static final List<TrustedContact> contacts = new CopyOnWriteArrayList<>();

    // Populate a default user so John Doe can log in immediately even if database fails
    public static void initialize(String encodedPassword) {
        if (users.isEmpty()) {
            User defaultUser = User.builder()
                    .id("mock-user-id")
                    .username("john")
                    .password(encodedPassword)
                    .email("john@example.com")
                    .fullName("John Doe")
                    .build();
            users.add(defaultUser);

            // Add some initial mock data to display in timeline and analytics
            LocalDate today = LocalDate.now();
            moodLogs.add(MoodLog.builder()
                    .id("mock-mood-1")
                    .userId("mock-user-id")
                    .date(today.minusDays(2))
                    .mood("Stressed")
                    .emotions(Arrays.asList("tired", "exhausted"))
                    .energyLevel(3)
                    .note("Too much work coding backend details.")
                    .sleepHours(5.5)
                    .exerciseMinutes(10)
                    .waterIntakeMl(1000)
                    .build());

            moodLogs.add(MoodLog.builder()
                    .id("mock-mood-2")
                    .userId("mock-user-id")
                    .date(today.minusDays(1))
                    .mood("Calm")
                    .emotions(Arrays.asList("peaceful", "grateful"))
                    .energyLevel(6)
                    .note("Took a long walk in the morning.")
                    .sleepHours(7.5)
                    .exerciseMinutes(40)
                    .waterIntakeMl(1800)
                    .build());

            journals.add(JournalEntry.builder()
                    .id("mock-journal-1")
                    .userId("mock-user-id")
                    .date(today.minusDays(2))
                    .title("Stressful day")
                    .content("Too many build issues. I feel a bit overwhelmed and tired.")
                    .summary("You felt stressed and overwhelmed due to build issues.")
                    .sentimentScore(-0.4)
                    .themes(Arrays.asList("work pressure", "tiredness"))
                    .reflectionQuestions(Arrays.asList("What is one small boundary you can set?"))
                    .copingStrategies(Arrays.asList("Practice box breathing for 2 minutes."))
                    .safetyAlertTriggered(false)
                    .build());

            lifeEvents.add(LifeEvent.builder()
                    .id("mock-event-1")
                    .userId("mock-user-id")
                    .date(today.minusDays(2))
                    .title("Major project milestone")
                    .description("Fitted all models and compiled layouts.")
                    .build());
        }
    }
}
