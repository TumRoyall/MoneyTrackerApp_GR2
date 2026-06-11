package com.examples.moneytracker.streak.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecordActivityResponse {
    private boolean updated;
    private Integer currentStreak;
    private boolean isNewDay;
    private List<AchievementResponse> newAchievements;
}
