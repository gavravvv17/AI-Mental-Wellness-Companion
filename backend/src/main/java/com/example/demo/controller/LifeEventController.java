package com.example.demo.controller;

import com.example.demo.dto.MessageResponse;
import com.example.demo.model.LifeEvent;
import com.example.demo.model.User;
import com.example.demo.repository.LifeEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/events")
public class LifeEventController {

    @Autowired
    private LifeEventRepository lifeEventRepository;

    @PostMapping
    public ResponseEntity<?> createEvent(Authentication authentication, @RequestBody LifeEvent request) {
        User user = (User) authentication.getPrincipal();
        LocalDate eventDate = request.getDate() != null ? request.getDate() : LocalDate.now();

        LifeEvent event = LifeEvent.builder()
                .user(user)
                .date(eventDate)
                .title(request.getTitle())
                .description(request.getDescription())
                .build();

        LifeEvent savedEvent = lifeEventRepository.save(event);
        return ResponseEntity.ok(savedEvent);
    }

    @GetMapping
    public ResponseEntity<List<LifeEvent>> getEvents(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<LifeEvent> events = lifeEventRepository.findByUserId(user.getId());
        events = new ArrayList<>(events);
        events.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return ResponseEntity.ok(events);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(Authentication authentication, @PathVariable String id) {
        User user = (User) authentication.getPrincipal();

        return lifeEventRepository.findById(id)
                .map(event -> {
                    if (!event.getUserId().equals(user.getId())) {
                        return ResponseEntity.status(403).body(new MessageResponse("Unauthorized to delete this event"));
                    }
                    lifeEventRepository.delete(event);
                    return ResponseEntity.ok(new MessageResponse("Event deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
