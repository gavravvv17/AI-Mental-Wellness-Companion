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
import org.springframework.http.client.SimpleClientHttpRequestFactory;
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

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeminiService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(45_000);
        this.restTemplate = new RestTemplate(factory);
    }

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

    public String getChatBuddyResponse(String userMessage, List<Map<String, String>> chatHistory) {
        if (!StringUtils.hasText(apiKey)) {
            return generateMockChatResponse(userMessage);
        }

        try {
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("You are Serenity, a compassionate, supportive, and active-listening AI mental wellness companion. ")
                    .append("Your goal is to provide a safe space, validate the user's feelings, and ask open-ended questions. ")
                    .append("Never provide clinical diagnoses or pretend to be a medical professional. If the user is in severe distress or talks about self-harm, ")
                    .append("gently provide support and strongly encourage them to seek professional support, providing a disclaimer. Keep responses warm, engaging, and under 3-4 sentences.\n\n");

            if (chatHistory != null) {
                promptBuilder.append("Chat History:\n");
                for (Map<String, String> msg : chatHistory) {
                    String role = msg.get("role");
                    String text = msg.get("text");
                    if (role != null && text != null) {
                        promptBuilder.append(role.equals("user") ? "User: " : "Serenity: ").append(text).append("\n");
                    }
                }
            }
            promptBuilder.append("User: ").append(userMessage).append("\n");
            promptBuilder.append("Serenity:");

            return callGeminiText(promptBuilder.toString());
        } catch (Exception e) {
            logger.error("Error communicating with Gemini API for chat, falling back to mock: {}", e.getMessage());
            return generateMockChatResponse(userMessage);
        }
    }

    private String callGemini(String prompt) throws Exception {
        return callGeminiInternal(prompt, true);
    }

    private String callGeminiText(String prompt) throws Exception {
        return callGeminiInternal(prompt, false);
    }

    private String callGeminiInternal(String prompt, boolean jsonMode) throws Exception {
        String urlWithKey = apiUrl + "?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> parts = new HashMap<>();
        parts.put("parts", Collections.singletonList(textPart));

        Map<String, Object> contentMap = new HashMap<>();
        contentMap.put("contents", Collections.singletonList(parts));

        if (jsonMode) {
            Map<String, Object> genConfig = new HashMap<>();
            genConfig.put("responseMimeType", "application/json");
            contentMap.put("generationConfig", genConfig);
        }

        String jsonPayload = objectMapper.writeValueAsString(contentMap);

        HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(urlWithKey, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
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

    private JournalAnalysis parseJournalAnalysis(String jsonText, String originalContent) {
        try {
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

    private JournalAnalysis generateMockAnalysis(String content) {
        JournalAnalysis analysis = new JournalAnalysis();
        String text = content.toLowerCase();

        analysis.summary = "You reflected on your current experiences and feelings in this entry.";
        analysis.sentimentScore = 0.1;

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

    private String generateMockChatResponse(String userMessage) {
        String msg = userMessage.toLowerCase();
        Random rand = new Random();

        if (msg.matches(".*\\b(hello|hi|hey|good morning|good evening|good afternoon|sup|howdy)\\b.*")) {
            String[] opts = {
                "Hey! 😊 It's great to have you here. How are you feeling right now — emotionally, mentally, physically?",
                "Hi there! I'm Serenity, and I'm fully here for you. What's been on your mind lately?",
                "Hello! I'm so glad you reached out. Tell me — how has your day been treating you so far?"
            };
            return opts[rand.nextInt(opts.length)];
        }

        if (msg.matches(".*\\b(sad|unhappy|miserable|depressed|depression|hopeless|worthless|empty|numb|broken|cry|crying|cried|tears)\\b.*")) {
            String[] opts = {
                "I'm really sorry you're feeling this way — that kind of heaviness is so hard to carry. You don't have to explain yourself perfectly; I just want you to know I'm here. Can you tell me a bit more about what's been going on?",
                "Sadness can feel so isolating, but reaching out like this takes real courage. What's been the hardest part of today for you?",
                "Thank you for trusting me with this. It sounds like you're going through something really painful right now. Is this something that's been building for a while, or did something happen recently?"
            };
            return opts[rand.nextInt(opts.length)];
        }

        if (msg.matches(".*\\b(anxious|anxiety|stress|stressed|overwhelm|overwhelmed|panic|worry|worried|nervous|tense|dread|burnout|racing thoughts)\\b.*")) {
            String[] opts = {
                "That sounds really overwhelming. When anxiety piles up, even small things can feel impossible. Take a slow breath — in for 4 counts, hold for 4, out for 4. Now, what's the biggest thing weighing on you right now?",
                "Stress and anxiety are your mind's way of flagging that something needs attention. What feels like the main source of pressure for you at the moment?",
                "I hear you — that restless, overwhelmed feeling is genuinely exhausting. What's one thing you can set aside mentally, just for the next 10 minutes, so we can focus on right now?"
            };
            return opts[rand.nextInt(opts.length)];
        }

        if (msg.matches(".*\\b(angry|anger|furious|frustrated|frustration|annoyed|irritated|rage|mad|hate|fed up)\\b.*")) {
            String[] opts = {
                "Anger often shows up when something important to us feels threatened or ignored. What's been happening that's stirred this up?",
                "It's completely valid to feel angry — your feelings are real and they matter. What's the situation you're dealing with right now?",
                "That frustration makes sense. Sometimes anger is just hurt in disguise. Can you walk me through what happened?"
            };
            return opts[rand.nextInt(opts.length)];
        }

        if (msg.matches(".*\\b(lonely|alone|isolated|no one|nobody|no friends|no support|disconnected|invisible)\\b.*")) {
            String[] opts = {
                "Loneliness is one of the most painful feelings there is, and I want you to know — right now, in this moment, you are not alone. What's been making you feel disconnected?",
                "Feeling unseen or unheard is genuinely hard. I see you, and I'm listening. Is this something that's been going on for a while?",
                "It takes strength to admit you're feeling lonely. Is there someone in your life you feel you could reach out to, even with a simple message? Sometimes a small connection can shift things."
            };
            return opts[rand.nextInt(opts.length)];
        }

        if (msg.matches(".*\\b(happy|excited|great|amazing|awesome|fantastic|wonderful|thrilled|joyful|good news|proud|celebrate|win|won)\\b.*")) {
            String[] opts = {
                "That's genuinely wonderful to hear! 🎉 I love that you're having a bright moment — what happened? Tell me more!",
                "Yes! It's so important to notice and celebrate the good. What's the source of this happiness?",
                "This makes me so happy for you! 😊 Positive moments are worth holding onto. What are you feeling proud or excited about?"
            };
            return opts[rand.nextInt(opts.length)];
        }

        if (msg.matches(".*\\b(can't sleep|insomnia|tired|exhausted|no sleep|sleep deprived|fatigued|restless|awake all night)\\b.*")) {
            String[] opts = {
                "Poor sleep affects everything — mood, focus, resilience. What's been keeping you awake? Is it racing thoughts, physical discomfort, or something else?",
                "Exhaustion is so draining, both mentally and physically. Have you been struggling with sleep for a while, or is this recent?",
                "Sleep troubles are really common when stress or anxiety are high. What does your bedtime routine look like right now? Sometimes small adjustments make a big difference."
            };
            return opts[rand.nextInt(opts.length)];
        }

        if (msg.matches(".*\\b(work|job|boss|deadline|exam|study|college|school|homework|assignment|project|career)\\b.*")) {
            String[] opts = {
                "It sounds like there's a lot of pressure coming from that direction. What's the most stressful part of what you're dealing with at work or school right now?",
                "Work and study pressures can really wear you down. Are you feeling overwhelmed by the volume, the difficulty, or something interpersonal?",
                "That kind of sustained pressure is tough. When did you last take a genuine break — not just a scroll, but actual rest? Your mind needs recovery time too."
            };
            return opts[rand.nextInt(opts.length)];
        }

        if (msg.matches(".*\\b(relationship|partner|boyfriend|girlfriend|husband|wife|family|parent|friend|breakup|broke up|divorce|fight|argument|conflict)\\b.*")) {
            String[] opts = {
                "Relationship difficulties are some of the most emotionally intense experiences we go through. What's been happening?",
                "It sounds like there's some real tension in an important relationship. Do you want to talk through what happened, or more about how you're feeling right now?",
                "Conflicts with the people we care about can be really draining. How long has this been going on, and how are you holding up?"
            };
            return opts[rand.nextInt(opts.length)];
        }

        if (msg.matches(".*\\b(grateful|gratitude|thankful|blessed|appreciate|mindful|journal|reflect|meditation|breathe)\\b.*")) {
            String[] opts = {
                "That's a beautiful practice — gratitude and reflection genuinely rewire how we see the world. What are you feeling appreciative of today?",
                "I love that you're tuning into gratitude. It's such a powerful anchor. What's one thing, big or small, that felt good today?",
                "Mindfulness is such a powerful tool. How are you feeling after taking that moment for yourself?"
            };
            return opts[rand.nextInt(opts.length)];
        }

        if (msg.matches(".*\\b(suicide|kill myself|end it|self.harm|hurt myself|want to die|not worth living)\\b.*")) {
            return "I'm really concerned about what you've shared, and I want you to know that your life matters deeply. Please reach out to a crisis helpline right now — iCall: 9152987821 or Vandrevala Foundation: 1860-2662-345 (available 24/7). You don't have to face this alone. Is there someone you trust you can call right now?";
        }

        String[] fallbacks = {
            "That's really interesting — tell me more. How long have you been feeling this way?",
            "I appreciate you opening up. What's been the most difficult part of this for you?",
            "It sounds like there's a lot going on. What would feel most helpful right now — to vent, to problem-solve, or just to feel heard?",
            "I'm here and I'm listening. Sometimes just putting it into words helps. What else is on your mind?",
            "That makes a lot of sense given what you're going through. What does your support system look like right now?",
            "I'm glad you're talking about this. How are you taking care of yourself through all of this?",
            "You know yourself better than anyone. What do you think would help you most right now?",
            "It takes courage to talk about these things. Can you tell me more about what's been going on for you lately?",
            "I want to understand this better. What has this experience been like for you day to day?"
        };
        return fallbacks[rand.nextInt(fallbacks.length)];
    }
}
