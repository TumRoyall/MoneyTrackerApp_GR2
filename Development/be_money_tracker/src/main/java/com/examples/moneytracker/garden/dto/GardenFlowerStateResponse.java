package com.examples.moneytracker.garden.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Maps to FE type: GardenFlowerState { stage, quality, progress }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GardenFlowerStateResponse {
    private String stage;
    private String quality;
    private double progress;
}
