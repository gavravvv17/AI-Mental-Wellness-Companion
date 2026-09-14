package com.example.demo.controller;

import com.example.demo.dto.MessageResponse;
import com.example.demo.model.TrustedContact;
import com.example.demo.model.User;
import com.example.demo.repository.TrustedContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/circle")
public class CircleController {

    @Autowired
    private TrustedContactRepository trustedContactRepository;

    @PostMapping("/contact")
    public ResponseEntity<?> addContact(Authentication authentication, @RequestBody TrustedContact request) {
        User user = (User) authentication.getPrincipal();

        TrustedContact contact = TrustedContact.builder()
                .user(user)
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .build();

        TrustedContact saved = trustedContactRepository.save(contact);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<TrustedContact>> getContacts(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<TrustedContact> contacts = trustedContactRepository.findByUserId(user.getId());
        return ResponseEntity.ok(contacts);
    }

    @DeleteMapping("/contact/{id}")
    public ResponseEntity<?> deleteContact(Authentication authentication, @PathVariable String id) {
        User user = (User) authentication.getPrincipal();

        return trustedContactRepository.findById(id)
                .map(contact -> {
                    if (!contact.getUserId().equals(user.getId())) {
                        return ResponseEntity.status(403).body(new MessageResponse("Unauthorized"));
                    }
                    trustedContactRepository.delete(contact);
                    return ResponseEntity.ok(new MessageResponse("Contact removed"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Autowired
    private com.example.demo.service.EmailService emailService;

    @PostMapping("/alert")
    public ResponseEntity<?> sendCircleAlert(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<TrustedContact> contacts = trustedContactRepository.findByUserId(user.getId());

        if (contacts.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("You don't have any contacts in your Trusted Circle yet!"));
        }

        int sentCount = 0;
        List<String> sentContactNames = new java.util.ArrayList<>();

        try {
            for (TrustedContact contact : contacts) {
                if (contact.getEmail() != null && !contact.getEmail().isBlank()) {
                    emailService.sendEmergencyAlertEmail(contact.getEmail().trim(), contact.getName(), user.getFullName());
                    sentCount++;
                    sentContactNames.add(contact.getName() + " (" + contact.getEmail() + ")");
                }
            }

            if (sentCount == 0) {
                return ResponseEntity.badRequest().body(new MessageResponse("None of your trusted contacts have valid email addresses!"));
            }

            String successMessage = "Emergency message successfully sent via email to: " + String.join(", ", sentContactNames);
            return ResponseEntity.ok(new MessageResponse(successMessage));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to send emergency message email: " + e.getMessage()));
        }
    }
}
