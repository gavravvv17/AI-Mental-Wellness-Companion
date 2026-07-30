package com.example.demo.controller;

import com.example.demo.model.HabitLog;
import com.example.demo.model.User;
import com.example.demo.repository.HabitLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/habits")
public class HabitController {

    @Autowired
    private HabitLogRepository habitLogRepository;

    @PostMapping("/toggle")
    public ResponseEntity<?> toggleHabit(Authentication authentication, @RequestParam String habitName, @RequestParam(required = false) String date) {
        User user = (User) authentication.getPrincipal();
        LocalDate logDate = date != null ? LocalDate.parse(date) : LocalDate.now();

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
                    .user(user)
                    .date(logDate)
                    .completedHabits(completed)
                    .build();
        }

        HabitLog savedLog = habitLogRepository.save(log);
        return ResponseEntity.ok(savedLog);
    }

    @GetMapping("/history")
    public ResponseEntity<List<HabitLog>> getHabitHistory(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<HabitLog> history = habitLogRepository.findByUserId(user.getId());
        history = new ArrayList<>(history);
        history.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return ResponseEntity.ok(history);
    }

    @GetMapping("/streaks")
    public ResponseEntity<?> getHabitStreaks(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<HabitLog> logs = habitLogRepository.findByUserId(user.getId());

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
