package com.example.demo.repository;

import com.example.demo.model.TrustedContact;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrustedContactRepository extends MongoRepository<TrustedContact, String> {
    List<TrustedContact> findByUserId(String userId);
}
