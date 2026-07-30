package com.example.demo.repository;

import com.example.demo.model.LifeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LifeEventRepository extends JpaRepository<LifeEvent, String> {

    @Query("SELECT e FROM LifeEvent e WHERE e.user.id = :userId")
    List<LifeEvent> findByUserId(@Param("userId") String userId);

    @Query("SELECT e FROM LifeEvent e WHERE e.user.id = :userId AND e.date BETWEEN :startDate AND :endDate")
    List<LifeEvent> findByUserIdAndDateBetween(@Param("userId") String userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
