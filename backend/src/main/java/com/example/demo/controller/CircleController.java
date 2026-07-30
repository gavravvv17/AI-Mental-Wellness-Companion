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

    @PostMapping("/alert")
    public ResponseEntity<?> sendCircleAlert(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<TrustedContact> contacts = trustedContactRepository.findByUserId(user.getId());

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
        result.append(". Message content: 'Hi, this is Serenity. User ")
                .append(user.getFullName())
                .append(" is having a difficult day and requested a quick check-in. Please reach out to them when you can.'");

        return ResponseEntity.ok(new MessageResponse(result.toString()));
    }
}
