package com.example.demo.controller;

import com.example.demo.model.JournalEntry;
import com.example.demo.model.User;
import com.example.demo.repository.JournalEntryRepository;
import com.example.demo.service.GeminiService;
import com.example.demo.service.GeminiService.JournalAnalysis;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/journal")
public class JournalController {

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private GeminiService geminiService;

    @PostMapping
    public ResponseEntity<?> createJournalEntry(Authentication authentication, @RequestBody JournalEntry request) {
        try {
            User user = (User) authentication.getPrincipal();
            LocalDate entryDate = request.getDate() != null ? request.getDate() : LocalDate.now();

            JournalAnalysis analysis = geminiService.analyzeJournal(request.getContent());

            Optional<JournalEntry> existingOpt = journalEntryRepository.findByUserIdAndDate(user.getId(), entryDate);
            JournalEntry journalEntry;

            if (existingOpt.isPresent()) {
                journalEntry = existingOpt.get();
                journalEntry.setTitle(request.getTitle() != null ? request.getTitle() : "Journal Reflection");
                journalEntry.setContent(request.getContent());
                journalEntry.setVoiceUrl(request.getVoiceUrl());
                journalEntry.setSummary(analysis.summary);
                journalEntry.setSentimentScore(analysis.sentimentScore);
                
                if (journalEntry.getThemes() != null) {
                    journalEntry.getThemes().clear();
                    if (analysis.themes != null) journalEntry.getThemes().addAll(analysis.themes);
                } else {
                    journalEntry.setThemes(analysis.themes);
                }

                if (journalEntry.getReflectionQuestions() != null) {
                    journalEntry.getReflectionQuestions().clear();
                    if (analysis.reflectionQuestions != null) journalEntry.getReflectionQuestions().addAll(analysis.reflectionQuestions);
                } else {
                    journalEntry.setReflectionQuestions(analysis.reflectionQuestions);
                }

                if (journalEntry.getCopingStrategies() != null) {
                    journalEntry.getCopingStrategies().clear();
                    if (analysis.copingStrategies != null) journalEntry.getCopingStrategies().addAll(analysis.copingStrategies);
                } else {
                    journalEntry.setCopingStrategies(analysis.copingStrategies);
                }

                journalEntry.setSafetyAlertTriggered(analysis.safetyAlertTriggered);
            } else {
                journalEntry = JournalEntry.builder()
                        .user(user)
                        .date(entryDate)
                        .title(request.getTitle() != null && !request.getTitle().isBlank() ? request.getTitle() : "Journal Reflection")
                        .content(request.getContent())
                        .voiceUrl(request.getVoiceUrl())
                        .summary(analysis.summary)
                        .sentimentScore(analysis.sentimentScore)
                        .themes(analysis.themes)
                        .reflectionQuestions(analysis.reflectionQuestions)
                        .copingStrategies(analysis.copingStrategies)
                        .safetyAlertTriggered(analysis.safetyAlertTriggered)
                        .build();
            }

            JournalEntry savedEntry = journalEntryRepository.save(journalEntry);
            return ResponseEntity.ok(savedEntry);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage(), "trace", Arrays.toString(e.getStackTrace())));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<JournalEntry>> getJournalHistory(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<JournalEntry> history = journalEntryRepository.findByUserId(user.getId());
        history = new ArrayList<>(history);
        history.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return ResponseEntity.ok(history);
    }
}
