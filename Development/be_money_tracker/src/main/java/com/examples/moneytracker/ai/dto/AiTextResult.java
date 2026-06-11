package com.examples.moneytracker.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiTextResult {
    private String provider;
    private String text;
}
