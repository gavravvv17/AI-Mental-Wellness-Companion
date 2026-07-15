package com.example.demo.controller;

import com.example.demo.model.JournalEntry;
import com.example.demo.model.User;
import com.example.demo.repository.JournalEntryRepository;
import com.example.demo.service.GeminiService;
import com.example.demo.service.GeminiService.JournalAnalysis;
import com.example.demo.service.InMemoryDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/journal")
public class JournalController {

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private GeminiService geminiService;

    @PostMapping
    public ResponseEntity<?> createJournalEntry(Authentication authentication, @RequestBody JournalEntry request) {
        User user = (User) authentication.getPrincipal();
        LocalDate entryDate = request.getDate() != null ? request.getDate() : LocalDate.now();

        // 1. Analyze journal text using GeminiService
        JournalAnalysis analysis = geminiService.analyzeJournal(request.getContent());

        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                Optional<JournalEntry> existingOpt = journalEntryRepository.findByUserIdAndDate(user.getId(), entryDate);
                JournalEntry journalEntry;

                if (existingOpt.isPresent()) {
                    journalEntry = existingOpt.get();
                    journalEntry.setTitle(request.getTitle() != null ? request.getTitle() : "Journal Reflection");
                    journalEntry.setContent(request.getContent());
                    journalEntry.setVoiceUrl(request.getVoiceUrl());
                    journalEntry.setSummary(analysis.summary);
                    journalEntry.setSentimentScore(analysis.sentimentScore);
                    journalEntry.setThemes(analysis.themes);
                    journalEntry.setReflectionQuestions(analysis.reflectionQuestions);
                    journalEntry.setCopingStrategies(analysis.copingStrategies);
                    journalEntry.setSafetyAlertTriggered(analysis.safetyAlertTriggered);
                } else {
                    journalEntry = JournalEntry.builder()
                            .userId(user.getId())
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
                InMemoryDatabase.isDatabaseOffline = true;
                return createJournalEntryInMemory(user.getId(), entryDate, request, analysis);
            }
        } else {
            return createJournalEntryInMemory(user.getId(), entryDate, request, analysis);
        }
    }

    private ResponseEntity<?> createJournalEntryInMemory(String userId, LocalDate entryDate, JournalEntry request, JournalAnalysis analysis) {
        Optional<JournalEntry> existingOpt = InMemoryDatabase.journals.stream()
                .filter(j -> j.getUserId().equals(userId) && j.getDate().equals(entryDate))
                .findFirst();

        JournalEntry journalEntry;
        if (existingOpt.isPresent()) {
            journalEntry = existingOpt.get();
            journalEntry.setTitle(request.getTitle() != null ? request.getTitle() : "Journal Reflection");
            journalEntry.setContent(request.getContent());
            journalEntry.setVoiceUrl(request.getVoiceUrl());
            journalEntry.setSummary(analysis.summary);
            journalEntry.setSentimentScore(analysis.sentimentScore);
            journalEntry.setThemes(analysis.themes);
            journalEntry.setReflectionQuestions(analysis.reflectionQuestions);
            journalEntry.setCopingStrategies(analysis.copingStrategies);
            journalEntry.setSafetyAlertTriggered(analysis.safetyAlertTriggered);
        } else {
            journalEntry = JournalEntry.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(userId)
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
            InMemoryDatabase.journals.add(journalEntry);
        }
        return ResponseEntity.ok(journalEntry);
    }

    @GetMapping("/history")
    public ResponseEntity<List<JournalEntry>> getJournalHistory(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<JournalEntry> history;
        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                history = journalEntryRepository.findByUserId(user.getId());
                history = new ArrayList<>(history);
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                history = InMemoryDatabase.journals.stream()
                        .filter(j -> j.getUserId().equals(user.getId()))
                        .collect(Collectors.toList());
            }
        } else {
            history = InMemoryDatabase.journals.stream()
                    .filter(j -> j.getUserId().equals(user.getId()))
                    .collect(Collectors.toList());
        }
        history.sort((a, b) -> b.getDate().compareTo(a.getDate())); // Newest first
        return ResponseEntity.ok(history);
    }
}
