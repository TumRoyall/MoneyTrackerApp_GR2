package com.examples.moneytracker.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiActionRequest {
    @NotBlank
    private String text;
}
