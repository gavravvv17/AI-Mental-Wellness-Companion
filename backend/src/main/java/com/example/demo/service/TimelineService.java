package com.example.demo.service;

import com.example.demo.dto.TimelineResponse;
import com.example.demo.dto.TimelineResponse.TimelineItem;
import com.example.demo.model.HabitLog;
import com.example.demo.model.JournalEntry;
import com.example.demo.model.LifeEvent;
import com.example.demo.model.MoodLog;
import com.example.demo.repository.HabitLogRepository;
import com.example.demo.repository.JournalEntryRepository;
import com.example.demo.repository.LifeEventRepository;
import com.example.demo.repository.MoodLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class TimelineService {

    @Autowired
    private MoodLogRepository moodLogRepository;

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private LifeEventRepository lifeEventRepository;

    @Autowired
    private HabitLogRepository habitLogRepository;

    public TimelineResponse getUserTimeline(String userId) {
        List<MoodLog> moodLogs = moodLogRepository.findByUserId(userId);
        List<JournalEntry> journals = journalEntryRepository.findByUserId(userId);
        List<LifeEvent> lifeEvents = lifeEventRepository.findByUserId(userId);
        List<HabitLog> habitLogs = habitLogRepository.findByUserId(userId);

        Map<LocalDate, TimelineItem> timelineMap = new TreeMap<>(Collections.reverseOrder());

        for (MoodLog mood : moodLogs) {
            TimelineItem item = timelineMap.computeIfAbsent(mood.getDate(), d -> TimelineItem.builder().date(d).build());
            item.setMood(mood.getMood());
            item.setEnergyLevel(mood.getEnergyLevel());
            item.setEmotions(mood.getEmotions());
            item.setSleepHours(mood.getSleepHours());
            item.setExerciseMinutes(mood.getExerciseMinutes());
            item.setWaterIntakeMl(mood.getWaterIntakeMl());
        }

        for (JournalEntry journal : journals) {
            TimelineItem item = timelineMap.computeIfAbsent(journal.getDate(), d -> TimelineItem.builder().date(d).build());
            item.setJournalId(journal.getId());
            item.setJournalTitle(journal.getTitle());
            item.setJournalSummary(journal.getSummary());
            item.setJournalSentiment(journal.getSentimentScore());
            item.setSafetyAlertTriggered(journal.getSafetyAlertTriggered());
        }

        for (LifeEvent event : lifeEvents) {
            TimelineItem item = timelineMap.computeIfAbsent(event.getDate(), d -> TimelineItem.builder().date(d).build());
            item.setLifeEventId(event.getId());
            item.setLifeEventTitle(event.getTitle());
            item.setLifeEventDescription(event.getDescription());
        }

        for (HabitLog habits : habitLogs) {
            TimelineItem item = timelineMap.computeIfAbsent(habits.getDate(), d -> TimelineItem.builder().date(d).build());
            item.setCompletedHabits(habits.getCompletedHabits());
        }

        List<TimelineItem> sortedItems = new ArrayList<>(timelineMap.values());

        List<String> insights = generateInsights(sortedItems);

        return TimelineResponse.builder()
                .items(sortedItems)
                .insights(insights)
                .build();
    }

    private List<String> generateInsights(List<TimelineItem> items) {
        List<String> insights = new ArrayList<>();

        if (items.size() < 3) {
            insights.add("Log your mood, sleep, and exercise for a few more days to discover emotional pattern insights!");
            return insights;
        }

        double positiveSleepSum = 0;
        int positiveSleepCount = 0;
        double negativeSleepSum = 0;
        int negativeSleepCount = 0;

        double positiveExerciseSum = 0;
        int positiveExerciseCount = 0;
        double negativeExerciseSum = 0;
        int negativeExerciseCount = 0;

        for (TimelineItem item : items) {
            String m = item.getMood();
            if (m == null) continue;
            
            boolean isPositive = m.equalsIgnoreCase("Happy") || m.equalsIgnoreCase("Calm") || m.equalsIgnoreCase("Energetic") || m.equalsIgnoreCase("Excited");
            boolean isNegative = m.equalsIgnoreCase("Stressed") || m.equalsIgnoreCase("Anxious") || m.equalsIgnoreCase("Sad") || m.equalsIgnoreCase("Tired");

            if (item.getSleepHours() != null && item.getSleepHours() > 0) {
                if (isPositive) {
                    positiveSleepSum += item.getSleepHours();
                    positiveSleepCount++;
                } else if (isNegative) {
                    negativeSleepSum += item.getSleepHours();
                    negativeSleepCount++;
                }
            }

            if (item.getExerciseMinutes() != null && item.getExerciseMinutes() > 0) {
                if (isPositive) {
                    positiveExerciseSum += item.getExerciseMinutes();
                    positiveExerciseCount++;
                } else if (isNegative) {
                    negativeExerciseSum += item.getExerciseMinutes();
                    negativeExerciseCount++;
                }
            }
        }

        if (positiveSleepCount > 0 && negativeSleepCount > 0) {
            double avgPosSleep = positiveSleepSum / positiveSleepCount;
            double avgNegSleep = negativeSleepSum / negativeSleepCount;
            
            if (Math.abs(avgPosSleep - avgNegSleep) >= 0.5) {
                insights.add(String.format("🌙 You usually sleep more on days you feel positive (Avg: %.1f hrs) compared to days you feel down or stressed (Avg: %.1f hrs).",
                        avgPosSleep, avgNegSleep));
            } else {
                insights.add(String.format("🌙 Your average sleep duration is around %.1f hours.", avgPosSleep));
            }
        }

        if (positiveExerciseCount > 0 && negativeExerciseCount > 0) {
            double avgPosEx = positiveExerciseSum / positiveExerciseCount;
            double avgNegEx = negativeExerciseSum / negativeExerciseCount;
            
            if (avgPosEx > avgNegEx + 5) {
                insights.add(String.format("🌿 Physical connection: Your positive mood days show an average of %.0f minutes of exercise, while lower days average %.0f minutes.",
                        avgPosEx, avgNegEx));
            }
        }

        long totalDaysWithMeditation = items.stream()
                .filter(i -> i.getCompletedHabits() != null && i.getCompletedHabits().contains("meditation"))
                .count();
        if (totalDaysWithMeditation >= 2) {
            insights.add(String.format("🧘 Mindfulness habit: You completed meditation on %d days. Keep it up to build emotional resilience!", totalDaysWithMeditation));
        }

        double avgSentiment = items.stream()
                .filter(i -> i.getJournalSentiment() != null)
                .mapToDouble(TimelineItem::getJournalSentiment)
                .average()
                .orElse(0.0);

        if (avgSentiment < -0.2) {
            insights.add("🚨 We noticed a lower average sentiment in your recent journal entries. Remember, your Trusted Circle is here for you, and seeking professional guidance can be a strong step forward.");
        } else if (avgSentiment > 0.4) {
            insights.add("☀️ Your journal reflections indicate a general trend of positivity and gratitude recently. Awesome work recognizing these bright moments!");
        }

        return insights;
    }
}
