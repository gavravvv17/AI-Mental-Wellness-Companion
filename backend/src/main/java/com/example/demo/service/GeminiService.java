package com.example.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {
    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public static class JournalAnalysis {
        public String summary;
        public double sentimentScore;
        public List<String> themes;
        public List<String> reflectionQuestions;
        public List<String> copingStrategies;
        public boolean safetyAlertTriggered;

        public JournalAnalysis() {
            this.themes = new ArrayList<>();
            this.reflectionQuestions = new ArrayList<>();
            this.copingStrategies = new ArrayList<>();
        }
    }

    /**
     * Analyze a journal entry using Gemini or a smart mock fallback.
     */
    public JournalAnalysis analyzeJournal(String content) {
        if (!StringUtils.hasText(apiKey)) {
            logger.info("Gemini API key is not configured. Using local smart analyzer.");
            return generateMockAnalysis(content);
        }

        try {
            String prompt = "Analyze the following private journal entry written by a user.\n" +
                    "Provide the response strictly as a valid JSON object with the following fields:\n" +
                    "1. \"summary\": A brief 1-2 sentence summary of the journal entry.\n" +
                    "2. \"sentimentScore\": A score from -1.0 (extremely distressed, anxious, sad, crisis) to 1.0 (extremely happy, excited, positive).\n" +
                    "3. \"themes\": A list of 2-4 emotional themes, triggers, or topics identified (e.g., [\"work pressure\", \"family conflict\", \"gratitude\", \"nature\"]).\n" +
                    "4. \"reflectionQuestions\": A list of 1-2 gentle, non-judgmental questions to help the user reflect further on their feelings.\n" +
                    "5. \"copingStrategies\": A list of 2-3 personalized, practical, non-medical wellness suggestions (e.g., \"Take a 5-minute walk outside\", \"Practice box breathing\", \"Write down 3 things you are grateful for\").\n" +
                    "6. \"safetyAlertTriggered\": A boolean. Set to true ONLY if the text indicates active crisis, suicide risk, self-harm, or severe danger, prompting emergency resource referrals. Otherwise, false.\n\n" +
                    "Journal Entry:\n" +
                    content + "\n\n" +
                    "Response JSON (do not include markdown ticks or anything other than pure JSON):";

            String responseText = callGemini(prompt);
            return parseJournalAnalysis(responseText, content);
        } catch (Exception e) {
            logger.error("Error communicating with Gemini API, falling back to mock: {}", e.getMessage());
            return generateMockAnalysis(content);
        }
    }

    /**
     * Chat with the user's AI supportive buddy using Gemini or a smart fallback.
     */
    public String getChatBuddyResponse(String userMessage, List<Map<String, String>> chatHistory) {
        if (!StringUtils.hasText(apiKey)) {
            return generateMockChatResponse(userMessage);
        }

        try {
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("You are MindMate, a compassionate, supportive, and active-listening AI mental wellness companion. ")
                    .append("Your goal is to provide a safe space, validate the user's feelings, and ask open-ended questions. ")
                    .append("Never provide clinical diagnoses or pretend to be a medical professional. If the user is in severe distress or talks about self-harm, ")
                    .append("gently provide support and strongly encourage them to seek professional support, providing a disclaimer. Keep responses warm, engaging, and under 3-4 sentences.\n\n");

            promptBuilder.append("Chat History:\n");
            for (Map<String, String> msg : chatHistory) {
                String role = msg.get("role");
                String text = msg.get("text");
                promptBuilder.append(role.equals("user") ? "User: " : "MindMate: ").append(text).append("\n");
            }
            promptBuilder.append("User: ").append(userMessage).append("\n");
            promptBuilder.append("MindMate:");

            return callGemini(promptBuilder.toString());
        } catch (Exception e) {
            logger.error("Error communicating with Gemini API for chat, falling back to mock: {}", e.getMessage());
            return generateMockChatResponse(userMessage);
        }
    }

    /**
     * Call the Gemini API.
     */
    private String callGemini(String prompt) throws Exception {
        String urlWithKey = apiUrl + "?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build Gemini payload structure
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> parts = new HashMap<>();
        parts.put("parts", Collections.singletonList(textPart));

        Map<String, Object> contentMap = new HashMap<>();
        contentMap.put("contents", Collections.singletonList(parts));

        // Add generationConfig for JSON response if we want it strictly
        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("responseMimeType", "application/json");
        contentMap.put("generationConfig", genConfig);

        String jsonPayload = objectMapper.writeValueAsString(contentMap);

        HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(urlWithKey, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            // Extract the generated text from Gemini structure: candidates[0].content.parts[0].text
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode partsNode = candidates.get(0).path("content").path("parts");
                if (partsNode.isArray() && partsNode.size() > 0) {
                    return partsNode.get(0).path("text").asText();
                }
            }
        }
        throw new RuntimeException("Empty or failed response from Gemini API");
    }

    /**
     * Parse the JSON response from Gemini.
     */
    private JournalAnalysis parseJournalAnalysis(String jsonText, String originalContent) {
        try {
            // Strip out markdown code block characters if Gemini ignored the instruction
            String cleanJson = jsonText.trim();
            if (cleanJson.startsWith("```")) {
                int firstBrace = cleanJson.indexOf("{");
                int lastBrace = cleanJson.lastIndexOf("}");
                if (firstBrace != -1 && lastBrace != -1) {
                    cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
                }
            }

            return objectMapper.readValue(cleanJson, JournalAnalysis.class);
        } catch (Exception e) {
            logger.warn("Failed to parse Gemini response as JSON: {}. Text was: {}. Generating smart mock instead.", e.getMessage(), jsonText);
            return generateMockAnalysis(originalContent);
        }
    }

    /**
     * Smart mock analyzer based on keyword search.
     */
    private JournalAnalysis generateMockAnalysis(String content) {
        JournalAnalysis analysis = new JournalAnalysis();
        String text = content.toLowerCase();

        analysis.summary = "You reflected on your current experiences and feelings in this entry.";
        analysis.sentimentScore = 0.1; // neutral-positive default

        if (text.contains("stress") || text.contains("work") || text.contains("burnout") || text.contains("exam") || text.contains("busy")) {
            analysis.sentimentScore = -0.3;
            analysis.themes.addAll(Arrays.asList("daily stress", "responsibilities"));
            analysis.summary = "You described feeling pressure or overload regarding your tasks or responsibilities.";
            analysis.reflectionQuestions.addAll(Arrays.asList(
                    "What is one tiny boundary you can set today to give yourself space?",
                    "Are there tasks you can delegate or defer to reduce your current workload?"
            ));
            analysis.copingStrategies.addAll(Arrays.asList(
                    "Try a 5-minute progressive muscle relaxation sequence.",
                    "Practice the 5-4-3-2-1 grounding exercise in our Mindfulness Library.",
                    "Take a complete screen break for 15 minutes."
            ));
        } else if (text.contains("sad") || text.contains("lonely") || text.contains("depressed") || text.contains("hurt") || text.contains("cry")) {
            analysis.sentimentScore = -0.6;
            analysis.themes.addAll(Arrays.asList("low mood", "isolation"));
            analysis.summary = "You expressed feelings of sadness, isolation, or emotional vulnerability.";
            analysis.reflectionQuestions.addAll(Arrays.asList(
                    "What does self-compassion look like for you in this moment?",
                    "Is there a trusted person you feel safe sending a quick hello to?"
            ));
            analysis.copingStrategies.addAll(Arrays.asList(
                    "Listen to a calming nature sound loop in our Mindfulness Library.",
                    "Wrap yourself in a warm blanket and do a 3-minute guided deep breathing cycle.",
                    "Reach out to someone in your Trusted Circle just to stay connected."
            ));
        } else if (text.contains("anxious") || text.contains("scared") || text.contains("fear") || text.contains("panic") || text.contains("worry")) {
            analysis.sentimentScore = -0.4;
            analysis.themes.addAll(Arrays.asList("anxiety", "worry"));
            analysis.summary = "You described experiencing worry, fear, or anxiety about current circumstances.";
            analysis.reflectionQuestions.addAll(Arrays.asList(
                    "Can we focus on what is within your control right now, rather than the unknown?",
                    "What is your body trying to tell you through this tension?"
            ));
            analysis.copingStrategies.addAll(Arrays.asList(
                    "Follow the Guided Breathing helper for a 4-7-8 relaxation cycle.",
                    "Splash cold water on your face to help stimulate the vagus nerve.",
                    "List 3 things you can hear, see, and touch around you right now."
            ));
        } else if (text.contains("happy") || text.contains("good") || text.contains("excited") || text.contains("grateful") || text.contains("love") || text.contains("joy")) {
            analysis.sentimentScore = 0.8;
            analysis.themes.addAll(Arrays.asList("positive reflection", "gratitude"));
            analysis.summary = "You shared a moment of joy, gratitude, or excitement about your day.";
            analysis.reflectionQuestions.addAll(Arrays.asList(
                    "How can you anchor this positive feeling in your memory for difficult days?",
                    "What led to this bright spot in your day?"
            ));
            analysis.copingStrategies.addAll(Arrays.asList(
                    "Take a moment to fully celebrate this win, no matter how small.",
                    "Share this positive energy with someone close to you.",
                    "Write down three details about this experience that you want to remember."
            ));
        } else {
            // Default Neutral
            analysis.themes.addAll(Arrays.asList("daily reflection", "neutral check-in"));
            analysis.reflectionQuestions.addAll(Arrays.asList(
                    "What was the most peaceful moment of your day today?",
                    "How are you feeling physically in your body right now?"
            ));
            analysis.copingStrategies.addAll(Arrays.asList(
                    "Try a quick hydration check: drink a glass of water.",
                    "Step outside for a 5-minute walk and notice the sky.",
                    "Spend 2 minutes stretching your neck and shoulders."
            ));
        }

        // Safety triggers check
        if (text.contains("suicide") || text.contains("kill myself") || text.contains("end it all") || text.contains("self-harm") || text.contains("want to die")) {
            analysis.safetyAlertTriggered = true;
            analysis.sentimentScore = -0.95;
            analysis.summary = "Your entry indicates extreme distress and feelings of despair.";
            analysis.reflectionQuestions.clear();
            analysis.reflectionQuestions.add("Please know that you do not have to carry this heavy burden alone. Are you open to reaching out for support right now?");
            analysis.copingStrategies.clear();
            analysis.copingStrategies.add("Contact a crisis support professional immediately (helplines are free, confidential, and available 24/7).");
            analysis.copingStrategies.add("Reach out directly to a contact in your Trusted Circle or a close loved one.");
        }

        return analysis;
    }

    /**
     * Smart mock chat response helper.
     */
    private String generateMockChatResponse(String userMessage) {
        String msg = userMessage.toLowerCase();
        if (msg.contains("hello") || msg.contains("hi") || msg.contains("hey")) {
            return "Hello there! I'm MindMate, your supportive buddy. How has your day been shaping up? I'm here to listen.";
        }
        if (msg.contains("sad") || msg.contains("lonely") || msg.contains("depressed") || msg.contains("crying")) {
            return "I am so sorry you are feeling this way. It is completely okay to feel sad or lonely sometimes. Remember to treat yourself with gentle kindness right now. Would you like to write more about what's on your mind?";
        }
        if (msg.contains("stress") || msg.contains("anxious") || msg.contains("overwhelm") || msg.contains("exam")) {
            return "It sounds like you're carrying a heavy load right now. Stress and anxiety can feel very physical. Let's take a deep breath together. Would you like to look at some grounding exercises, or simply vent?";
        }
        if (msg.contains("thank") || msg.contains("help")) {
            return "You are very welcome! Supporting you is my primary goal. Remember that taking care of your mind is a daily journey. Is there anything else you'd like to talk about?";
        }
        return "Thank you for sharing that with me. I hear you, and I validate what you're going through. What do you think would bring you even a small sense of ease or comfort right now?";
    }
}
