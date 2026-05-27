package com.examples.moneytracker.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class PromptInput {
    private String text;
    private List<String> conversationHistory;
}
