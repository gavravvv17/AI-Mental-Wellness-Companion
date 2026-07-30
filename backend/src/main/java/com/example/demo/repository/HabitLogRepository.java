package com.example.demo.repository;

import com.example.demo.model.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HabitLogRepository extends JpaRepository<HabitLog, String> {

    @Query("SELECT h FROM HabitLog h WHERE h.user.id = :userId")
    List<HabitLog> findByUserId(@Param("userId") String userId);

    @Query("SELECT h FROM HabitLog h WHERE h.user.id = :userId AND h.date BETWEEN :startDate AND :endDate")
    List<HabitLog> findByUserIdAndDateBetween(@Param("userId") String userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT h FROM HabitLog h WHERE h.user.id = :userId AND h.date = :date")
    Optional<HabitLog> findByUserIdAndDate(@Param("userId") String userId, @Param("date") LocalDate date);
}
