package com.examples.moneytracker.garden.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Maps to FE type: GardenScore { value, label }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GardenScoreResponse {
    private int value;
    private String label;
}
