package com.example.demo.controller;

import com.example.demo.dto.TimelineResponse;
import com.example.demo.model.User;
import com.example.demo.service.TimelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/timeline")
public class TimelineController {

    @Autowired
    private TimelineService timelineService;

    @GetMapping
    public ResponseEntity<TimelineResponse> getTimeline(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        TimelineResponse response = timelineService.getUserTimeline(user.getId());
        return ResponseEntity.ok(response);
    }
}
