package com.examples.moneytracker.streak.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StreakResponse {
    private Integer currentStreak;
    private Integer longestStreak;
    private LocalDate lastActiveDate;
    private LocalDate streakStartDate;
    private Integer resetHours;
    private Integer totalActiveDays;
    private List<LocalDate> activeDates;
    private List<AchievementResponse> achievements;
}
