package com.examples.moneytracker.streak.dto;

import com.examples.moneytracker.streak.model.AchievementType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AchievementResponse {
    private UUID achievementId;
    private AchievementType type;
    private Integer level;
    private Instant achievedAt;
    private String title;
    private String description;
    private String icon;
}
