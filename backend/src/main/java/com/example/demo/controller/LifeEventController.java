package com.example.demo.controller;

import com.example.demo.dto.MessageResponse;
import com.example.demo.model.LifeEvent;
import com.example.demo.model.User;
import com.example.demo.repository.LifeEventRepository;
import com.example.demo.service.InMemoryDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class LifeEventController {

    @Autowired
    private LifeEventRepository lifeEventRepository;

    @PostMapping
    public ResponseEntity<?> createEvent(Authentication authentication, @RequestBody LifeEvent request) {
        User user = (User) authentication.getPrincipal();
        LocalDate eventDate = request.getDate() != null ? request.getDate() : LocalDate.now();

        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                LifeEvent event = LifeEvent.builder()
                        .userId(user.getId())
                        .date(eventDate)
                        .title(request.getTitle())
                        .description(request.getDescription())
                        .build();

                LifeEvent savedEvent = lifeEventRepository.save(event);
                return ResponseEntity.ok(savedEvent);
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                return createEventInMemory(user.getId(), eventDate, request);
            }
        } else {
            return createEventInMemory(user.getId(), eventDate, request);
        }
    }

    private ResponseEntity<?> createEventInMemory(String userId, LocalDate eventDate, LifeEvent request) {
        LifeEvent event = LifeEvent.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .date(eventDate)
                .title(request.getTitle())
                .description(request.getDescription())
                .build();
        InMemoryDatabase.lifeEvents.add(event);
        return ResponseEntity.ok(event);
    }

    @GetMapping
    public ResponseEntity<List<LifeEvent>> getEvents(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<LifeEvent> events;
        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                events = lifeEventRepository.findByUserId(user.getId());
                events = new ArrayList<>(events);
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                events = InMemoryDatabase.lifeEvents.stream()
                        .filter(le -> le.getUserId().equals(user.getId()))
                        .collect(Collectors.toList());
            }
        } else {
            events = InMemoryDatabase.lifeEvents.stream()
                    .filter(le -> le.getUserId().equals(user.getId()))
                    .collect(Collectors.toList());
        }
        events.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return ResponseEntity.ok(events);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(Authentication authentication, @PathVariable String id) {
        User user = (User) authentication.getPrincipal();
        
        if (!InMemoryDatabase.isDatabaseOffline) {
            try {
                return lifeEventRepository.findById(id)
                        .map(event -> {
                            if (!event.getUserId().equals(user.getId())) {
                                return ResponseEntity.status(403).body(new MessageResponse("Unauthorized to delete this event"));
                            }
                            lifeEventRepository.delete(event);
                            return ResponseEntity.ok(new MessageResponse("Event deleted successfully"));
                        })
                        .orElse(ResponseEntity.notFound().build());
            } catch (Exception e) {
                InMemoryDatabase.isDatabaseOffline = true;
                return deleteEventInMemory(user.getId(), id);
            }
        } else {
            return deleteEventInMemory(user.getId(), id);
        }
    }

    private ResponseEntity<?> deleteEventInMemory(String userId, String id) {
        Optional<LifeEvent> match = InMemoryDatabase.lifeEvents.stream()
                .filter(le -> le.getId().equals(id) && le.getUserId().equals(userId))
                .findFirst();
        if (match.isPresent()) {
            InMemoryDatabase.lifeEvents.remove(match.get());
            return ResponseEntity.ok(new MessageResponse("Event deleted successfully (In-Memory)"));
        }
        return ResponseEntity.notFound().build();
    }
}
