package com.examples.moneytracker.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiActionResponse {
    private String intent;
    private Map<String, Object> structuredResult;
    private String message;
    private AiActionMeta meta;
}
