package com.example.demo;

import com.example.demo.model.JournalEntry;
import com.example.demo.model.LifeEvent;
import com.example.demo.model.MoodLog;
import com.example.demo.model.User;
import com.example.demo.repository.JournalEntryRepository;
import com.example.demo.repository.LifeEventRepository;
import com.example.demo.repository.MoodLogRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Arrays;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            MoodLogRepository moodLogRepository,
            JournalEntryRepository journalEntryRepository,
            LifeEventRepository lifeEventRepository,
            PasswordEncoder encoder) {
        return args -> {
            if (!userRepository.existsByUsername("john")) {
                User defaultUser = User.builder()
                        .username("john")
                        .password(encoder.encode("password123"))
                        .email("john@example.com")
                        .fullName("John Doe")
                        .build();
                defaultUser = userRepository.save(defaultUser);

                LocalDate today = LocalDate.now();
                
                moodLogRepository.save(MoodLog.builder()
                        .user(defaultUser)
                        .date(today.minusDays(2))
                        .mood("Stressed")
                        .emotions(Arrays.asList("tired", "exhausted"))
                        .energyLevel(3)
                        .note("Too much work coding backend details.")
                        .sleepHours(5.5)
                        .exerciseMinutes(10)
                        .waterIntakeMl(1000)
                        .build());

                moodLogRepository.save(MoodLog.builder()
                        .user(defaultUser)
                        .date(today.minusDays(1))
                        .mood("Calm")
                        .emotions(Arrays.asList("peaceful", "grateful"))
                        .energyLevel(6)
                        .note("Took a long walk in the morning.")
                        .sleepHours(7.5)
                        .exerciseMinutes(40)
                        .waterIntakeMl(1800)
                        .build());

                journalEntryRepository.save(JournalEntry.builder()
                        .user(defaultUser)
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

                lifeEventRepository.save(LifeEvent.builder()
                        .user(defaultUser)
                        .date(today.minusDays(2))
                        .title("Major project milestone")
                        .description("Fitted all models and compiled layouts.")
                        .build());
            }
        };
    }
}
