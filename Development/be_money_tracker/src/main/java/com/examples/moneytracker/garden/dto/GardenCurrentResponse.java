package com.examples.moneytracker.garden.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Maps to FE type: GardenCurrentState.
 * Returned by GET /api/garden/current and POST /api/garden/select-seed.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GardenCurrentResponse {
    private String month;
    private GardenSeedResponse seed;
    private GardenScoreResponse score;
    private String weather;
    private GardenFlowerStateResponse flower;
    private int dailyStreak;
    private int tasksCompletedToday;
    private int tasksTotalToday;
    private String encouragement;
    private List<GardenRewardResponse> rewards;
}
