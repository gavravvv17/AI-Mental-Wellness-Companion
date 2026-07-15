package com.example.demo.repository;

import com.example.demo.model.JournalEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends MongoRepository<JournalEntry, String> {
    List<JournalEntry> findByUserId(String userId);
    List<JournalEntry> findByUserIdAndDateBetween(String userId, LocalDate startDate, LocalDate endDate);
    Optional<JournalEntry> findByUserIdAndDate(String userId, LocalDate date);
}
