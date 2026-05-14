package com.examples.moneytracker.garden.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Maps to FE type: GardenHistoryItem.
 * Returned by GET /api/garden/history.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GardenHistoryResponse {
    private String month;
    private int year;
    private GardenSeedResponse seed;
    private GardenScoreResponse score;
    private GardenFlowerStateResponse flower;
    private String completedAt;
}
