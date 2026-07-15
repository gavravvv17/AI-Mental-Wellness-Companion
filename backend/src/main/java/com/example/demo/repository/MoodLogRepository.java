package com.example.demo.repository;

import com.example.demo.model.MoodLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MoodLogRepository extends MongoRepository<MoodLog, String> {
    List<MoodLog> findByUserId(String userId);
    List<MoodLog> findByUserIdAndDateBetween(String userId, LocalDate startDate, LocalDate endDate);
    Optional<MoodLog> findByUserIdAndDate(String userId, LocalDate date);
}
