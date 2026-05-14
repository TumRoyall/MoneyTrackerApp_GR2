package com.examples.moneytracker.garden.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SelectSeedRequest {
    @NotBlank(message = "seedId is required")
    private String seedId;
}
