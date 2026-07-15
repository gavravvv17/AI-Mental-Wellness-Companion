package com.example.demo.controller;

import com.example.demo.model.HabitLog;
import com.example.demo.model.User;
import com.example.demo.repository.HabitLogRepository;
import com.example.demo.service.InMemoryDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/habits")
public class HabitController {

    @Autowired
    private HabitLogRepository habitLogRepository;

    @PostMapping("/toggle")
    public ResponseEntity<?> toggleHabit(Authentication authentication, @RequestParam String habitName, @RequestParam(required = false) String date) {
        User user = (User) authentication.getPrincipal();
        LocalDate logDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                Optional<HabitLog> existingLogOpt = habitLogRepository.findByUserIdAndDate(user.getId(), logDate);
                HabitLog log;

                if (existingLogOpt.isPresent()) {
                    log = existingLogOpt.get();
                    List<String> completed = log.getCompletedHabits();
                    if (completed.contains(habitName)) {
                        completed.remove(habitName); // Toggle off
                    } else {
                        completed.add(habitName); // Toggle on
                    }
                } else {
                    List<String> completed = new ArrayList<>();
                    completed.add(habitName);
                    log = HabitLog.builder()
                            .userId(user.getId())
                            .date(logDate)
                            .completedHabits(completed)
                            .build();
                }

                HabitLog savedLog = habitLogRepository.save(log);
                return ResponseEntity.ok(savedLog);
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                return toggleHabitInMemory(user.getId(), logDate, habitName);
            }
        } else {
            return toggleHabitInMemory(user.getId(), logDate, habitName);
        }
    }

    private ResponseEntity<?> toggleHabitInMemory(String userId, LocalDate logDate, String habitName) {
        Optional<HabitLog> existingLogOpt = InMemoryDatabase.habitLogs.stream()
                .filter(h -> h.getUserId().equals(userId) && h.getDate().equals(logDate))
                .findFirst();
        
        HabitLog log;
        if (existingLogOpt.isPresent()) {
            log = existingLogOpt.get();
            List<String> completed = log.getCompletedHabits();
            if (completed.contains(habitName)) {
                completed.remove(habitName);
            } else {
                completed.add(habitName);
            }
        } else {
            List<String> completed = new ArrayList<>();
            completed.add(habitName);
            log = HabitLog.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(userId)
                    .date(logDate)
                    .completedHabits(completed)
                    .build();
            InMemoryDatabase.habitLogs.add(log);
        }
        return ResponseEntity.ok(log);
    }

    @GetMapping("/history")
    public ResponseEntity<List<HabitLog>> getHabitHistory(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<HabitLog> history;
        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                history = habitLogRepository.findByUserId(user.getId());
                history = new ArrayList<>(history);
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                history = InMemoryDatabase.habitLogs.stream()
                        .filter(h -> h.getUserId().equals(user.getId()))
                        .collect(Collectors.toList());
            }
        } else {
            history = InMemoryDatabase.habitLogs.stream()
                    .filter(h -> h.getUserId().equals(user.getId()))
                    .collect(Collectors.toList());
        }
        history.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return ResponseEntity.ok(history);
    }

    @GetMapping("/streaks")
    public ResponseEntity<?> getHabitStreaks(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<HabitLog> logs;
        
        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                logs = habitLogRepository.findByUserId(user.getId());
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                logs = InMemoryDatabase.habitLogs.stream()
                        .filter(h -> h.getUserId().equals(user.getId()))
                        .collect(Collectors.toList());
            }
        } else {
            logs = InMemoryDatabase.habitLogs.stream()
                    .filter(h -> h.getUserId().equals(user.getId()))
                    .collect(Collectors.toList());
        }

        // Map logs by date for quick lookup
        Map<LocalDate, List<String>> habitsByDate = new HashMap<>();
        for (HabitLog log : logs) {
            habitsByDate.put(log.getDate(), log.getCompletedHabits());
        }

        // Define our habits list
        List<String> standardHabits = Arrays.asList("sleep", "exercise", "water", "reading", "meditation", "screentime");
        Map<String, Integer> streaks = new HashMap<>();

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        for (String habit : standardHabits) {
            int streak = 0;
            LocalDate checkDate = today;

            // If not completed today, check starting from yesterday to allow maintaining streak
            List<String> todayHabits = habitsByDate.get(today);
            if (todayHabits == null || !todayHabits.contains(habit)) {
                checkDate = yesterday;
            }

            // Loop backwards to count consecutive days
            while (true) {
                List<String> completed = habitsByDate.get(checkDate);
                if (completed != null && completed.contains(habit)) {
                    streak++;
                    checkDate = checkDate.minusDays(1);
                } else {
                    break;
                }
            }

            streaks.put(habit, streak);
        }

        return ResponseEntity.ok(streaks);
    }
}
