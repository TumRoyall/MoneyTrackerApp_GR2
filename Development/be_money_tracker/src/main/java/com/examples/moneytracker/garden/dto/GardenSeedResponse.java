package com.examples.moneytracker.garden.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Maps to FE type: GardenSeed { seedId, name, rarity, description, previewColors }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GardenSeedResponse {
    private String seedId;
    private String name;
    private String rarity;
    private String description;
    private PreviewColors previewColors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreviewColors {
        private String petal;
        private String center;
        private String leaf;
    }
}
