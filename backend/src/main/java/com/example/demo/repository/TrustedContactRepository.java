package com.example.demo.repository;

import com.example.demo.model.TrustedContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrustedContactRepository extends JpaRepository<TrustedContact, String> {

    @Query("SELECT c FROM TrustedContact c WHERE c.user.id = :userId")
    List<TrustedContact> findByUserId(@Param("userId") String userId);
}
