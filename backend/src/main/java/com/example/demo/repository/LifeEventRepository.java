package com.example.demo.repository;

import com.example.demo.model.LifeEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LifeEventRepository extends MongoRepository<LifeEvent, String> {
    List<LifeEvent> findByUserId(String userId);
    List<LifeEvent> findByUserIdAndDateBetween(String userId, LocalDate startDate, LocalDate endDate);
}
