package com.examples.moneytracker.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AiActionMeta {
    private double intentConfidence;
    private String aiProvider;
    private boolean aiFallbackUsed;
    private List<String> suggestions;
}
