package com.example.demo.controller;

import com.example.demo.model.MoodLog;
import com.example.demo.model.User;
import com.example.demo.repository.MoodLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/mood")
public class MoodController {

    @Autowired
    private MoodLogRepository moodLogRepository;

    @PostMapping
    public ResponseEntity<?> logMood(Authentication authentication, @RequestBody MoodLog moodLogRequest) {
        User user = (User) authentication.getPrincipal();
        LocalDate logDate = moodLogRequest.getDate() != null ? moodLogRequest.getDate() : LocalDate.now();

        Optional<MoodLog> existingLogOpt = moodLogRepository.findByUserIdAndDate(user.getId(), logDate);
        MoodLog moodLog;
        
        if (existingLogOpt.isPresent()) {
            moodLog = existingLogOpt.get();
            moodLog.setMood(moodLogRequest.getMood());
            moodLog.setEmotions(moodLogRequest.getEmotions());
            moodLog.setEnergyLevel(moodLogRequest.getEnergyLevel());
            moodLog.setNote(moodLogRequest.getNote());
            moodLog.setSleepHours(moodLogRequest.getSleepHours());
            moodLog.setExerciseMinutes(moodLogRequest.getExerciseMinutes());
            moodLog.setWaterIntakeMl(moodLogRequest.getWaterIntakeMl());
        } else {
            moodLog = MoodLog.builder()
                    .user(user)
                    .date(logDate)
                    .mood(moodLogRequest.getMood())
                    .emotions(moodLogRequest.getEmotions())
                    .energyLevel(moodLogRequest.getEnergyLevel())
                    .note(moodLogRequest.getNote())
                    .sleepHours(moodLogRequest.getSleepHours())
                    .exerciseMinutes(moodLogRequest.getExerciseMinutes())
                    .waterIntakeMl(moodLogRequest.getWaterIntakeMl())
                    .build();
        }

        MoodLog savedLog = moodLogRepository.save(moodLog);
        return ResponseEntity.ok(savedLog);
    }

    @GetMapping("/history")
    public ResponseEntity<List<MoodLog>> getMoodHistory(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<MoodLog> history = moodLogRepository.findByUserId(user.getId());
        history = new ArrayList<>(history); // Ensure mutable
        history.sort((a, b) -> b.getDate().compareTo(a.getDate())); // Newest first
        return ResponseEntity.ok(history);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getMoodStats(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<MoodLog> history = moodLogRepository.findByUserId(user.getId());

        // Count moods
        Map<String, Integer> moodCounts = new HashMap<>();
        double totalSleep = 0;
        int sleepDays = 0;
        double totalExercise = 0;
        int exerciseDays = 0;
        Map<Integer, Integer> energyCounts = new HashMap<>();

        for (MoodLog log : history) {
            String m = log.getMood();
            if (m != null) {
                moodCounts.put(m, moodCounts.getOrDefault(m, 0) + 1);
            }
            if (log.getSleepHours() > 0) {
                totalSleep += log.getSleepHours();
                sleepDays++;
            }
            if (log.getExerciseMinutes() > 0) {
                totalExercise += log.getExerciseMinutes();
                exerciseDays++;
            }
            energyCounts.put(log.getEnergyLevel(), energyCounts.getOrDefault(log.getEnergyLevel(), 0) + 1);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("moodCounts", moodCounts);
        stats.put("averageSleep", sleepDays > 0 ? totalSleep / sleepDays : 0.0);
        stats.put("averageExercise", exerciseDays > 0 ? totalExercise / exerciseDays : 0.0);
        stats.put("energyDistribution", energyCounts);
        stats.put("totalLogs", history.size());

        return ResponseEntity.ok(stats);
    }
}
