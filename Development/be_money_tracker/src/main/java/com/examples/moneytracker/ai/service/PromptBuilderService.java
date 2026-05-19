package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.PromptInput;

import java.util.Map;

public interface PromptBuilderService {
    PromptInput buildPrompt(String intent, Map<String, Object> structuredResult, String userMessage);
}
