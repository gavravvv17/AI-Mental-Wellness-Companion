package com.example.demo.controller;

import com.example.demo.dto.MessageResponse;
import com.example.demo.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private GeminiService geminiService;

    public static class ChatRequest {
        private String message;
        private List<Map<String, String>> history; // e.g. [{"role": "user", "text": "hello"}]

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public List<Map<String, String>> getHistory() {
            return history;
        }

        public void setHistory(List<Map<String, String>> history) {
            this.history = history;
        }
    }

    @PostMapping
    public ResponseEntity<?> sendChatMessage(@RequestBody ChatRequest request) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Message cannot be empty"));
        }

        String reply = geminiService.getChatBuddyResponse(request.getMessage(), request.getHistory());
        return ResponseEntity.ok(new MessageResponse(reply));
    }
}
