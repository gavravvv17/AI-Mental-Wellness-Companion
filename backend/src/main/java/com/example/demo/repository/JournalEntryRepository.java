package com.example.demo.repository;

import com.example.demo.model.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, String> {

    @Query("SELECT j FROM JournalEntry j WHERE j.user.id = :userId")
    List<JournalEntry> findByUserId(@Param("userId") String userId);

    @Query("SELECT j FROM JournalEntry j WHERE j.user.id = :userId AND j.date BETWEEN :startDate AND :endDate")
    List<JournalEntry> findByUserIdAndDateBetween(@Param("userId") String userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT j FROM JournalEntry j WHERE j.user.id = :userId AND j.date = :date")
    Optional<JournalEntry> findByUserIdAndDate(@Param("userId") String userId, @Param("date") LocalDate date);
}
