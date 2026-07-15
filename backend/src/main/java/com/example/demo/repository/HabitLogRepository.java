package com.example.demo.repository;

import com.example.demo.model.HabitLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HabitLogRepository extends MongoRepository<HabitLog, String> {
    List<HabitLog> findByUserId(String userId);
    List<HabitLog> findByUserIdAndDateBetween(String userId, LocalDate startDate, LocalDate endDate);
    Optional<HabitLog> findByUserIdAndDate(String userId, LocalDate date);
}
