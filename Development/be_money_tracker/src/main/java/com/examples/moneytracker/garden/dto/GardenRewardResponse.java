package com.examples.moneytracker.garden.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Maps to FE type: GardenReward { rewardId, title, description, earnedAt, badgeColor }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GardenRewardResponse {
    private String rewardId;
    private String title;
    private String description;
    private String earnedAt;
    private String badgeColor;
}
