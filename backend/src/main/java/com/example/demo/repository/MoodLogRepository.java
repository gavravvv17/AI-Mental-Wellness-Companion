package com.example.demo.repository;

import com.example.demo.model.MoodLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MoodLogRepository extends JpaRepository<MoodLog, String> {

    @Query("SELECT m FROM MoodLog m WHERE m.user.id = :userId")
    List<MoodLog> findByUserId(@Param("userId") String userId);

    @Query("SELECT m FROM MoodLog m WHERE m.user.id = :userId AND m.date BETWEEN :startDate AND :endDate")
    List<MoodLog> findByUserIdAndDateBetween(@Param("userId") String userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT m FROM MoodLog m WHERE m.user.id = :userId AND m.date = :date")
    Optional<MoodLog> findByUserIdAndDate(@Param("userId") String userId, @Param("date") LocalDate date);
}
