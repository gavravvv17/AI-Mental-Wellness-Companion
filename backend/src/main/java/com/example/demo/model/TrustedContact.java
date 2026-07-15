package com.example.demo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "trusted_contacts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrustedContact {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String name;
    private String email;
    private String phone;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
