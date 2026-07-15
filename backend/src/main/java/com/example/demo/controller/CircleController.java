package com.example.demo.controller;

import com.example.demo.dto.MessageResponse;
import com.example.demo.model.TrustedContact;
import com.example.demo.model.User;
import com.example.demo.repository.TrustedContactRepository;
import com.example.demo.service.InMemoryDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/circle")
public class CircleController {

    @Autowired
    private TrustedContactRepository trustedContactRepository;

    @PostMapping("/contact")
    public ResponseEntity<?> addContact(Authentication authentication, @RequestBody TrustedContact request) {
        User user = (User) authentication.getPrincipal();

        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                TrustedContact contact = TrustedContact.builder()
                        .userId(user.getId())
                        .name(request.getName())
                        .email(request.getEmail())
                        .phone(request.getPhone())
                        .build();

                TrustedContact saved = trustedContactRepository.save(contact);
                return ResponseEntity.ok(saved);
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                return addContactInMemory(user.getId(), request);
            }
        } else {
            return addContactInMemory(user.getId(), request);
        }
    }

    private ResponseEntity<?> addContactInMemory(String userId, TrustedContact request) {
        TrustedContact contact = TrustedContact.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .build();
        InMemoryDatabase.contacts.add(contact);
        return ResponseEntity.ok(contact);
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<TrustedContact>> getContacts(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<TrustedContact> contacts;
        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                contacts = trustedContactRepository.findByUserId(user.getId());
                contacts = new ArrayList<>(contacts);
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                contacts = InMemoryDatabase.contacts.stream()
                        .filter(c -> c.getUserId().equals(user.getId()))
                        .collect(Collectors.toList());
            }
        } else {
            contacts = InMemoryDatabase.contacts.stream()
                    .filter(c -> c.getUserId().equals(user.getId()))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(contacts);
    }

    @DeleteMapping("/contact/{id}")
    public ResponseEntity<?> deleteContact(Authentication authentication, @PathVariable String id) {
        User user = (User) authentication.getPrincipal();

        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                return trustedContactRepository.findById(id)
                        .map(contact -> {
                            if (!contact.getUserId().equals(user.getId())) {
                                return ResponseEntity.status(403).body(new MessageResponse("Unauthorized"));
                            }
                            trustedContactRepository.delete(contact);
                            return ResponseEntity.ok(new MessageResponse("Contact removed"));
                        })
                        .orElse(ResponseEntity.notFound().build());
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                return deleteContactInMemory(user.getId(), id);
            }
        } else {
            return deleteContactInMemory(user.getId(), id);
        }
    }

    private ResponseEntity<?> deleteContactInMemory(String userId, String id) {
        Optional<TrustedContact> match = InMemoryDatabase.contacts.stream()
                .filter(c -> c.getId().equals(id) && c.getUserId().equals(userId))
                .findFirst();
        if (match.isPresent()) {
            InMemoryDatabase.contacts.remove(match.get());
            return ResponseEntity.ok(new MessageResponse("Contact removed (In-Memory)"));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/alert")
    public ResponseEntity<?> sendCircleAlert(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<TrustedContact> contacts;
        
        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                contacts = trustedContactRepository.findByUserId(user.getId());
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                contacts = InMemoryDatabase.contacts.stream()
                        .filter(c -> c.getUserId().equals(user.getId()))
                        .collect(Collectors.toList());
            }
        } else {
            contacts = InMemoryDatabase.contacts.stream()
                    .filter(c -> c.getUserId().equals(user.getId()))
                    .collect(Collectors.toList());
        }

        if (contacts.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("You don't have any contacts in your Trusted Circle yet!"));
        }

        // Simulate sending SMS/emails
        StringBuilder result = new StringBuilder();
        result.append("[SIMULATED ACTION] Alert broadcasted! Sent messages to: ");
        for (int i = 0; i < contacts.size(); i++) {
            result.append(contacts.get(i).getName());
            if (i < contacts.size() - 1) {
                result.append(", ");
            }
        }
        result.append(". Message content: 'Hi, this is MindMate. User ")
                .append(user.getFullName())
                .append(" is having a difficult day and requested a quick check-in. Please reach out to them when you can.'");

        return ResponseEntity.ok(new MessageResponse(result.toString()));
    }
}
