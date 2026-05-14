package com.examples.moneytracker.garden.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Maps to FE type: GardenTask { taskId, title, description, xp, completed }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GardenTaskResponse {
    private String taskId;
    private String title;
    private String description;
    private int xp;
    private boolean completed;
}
