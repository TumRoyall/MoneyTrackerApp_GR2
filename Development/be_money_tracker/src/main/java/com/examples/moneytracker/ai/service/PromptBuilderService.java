package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.PromptInput;

import java.util.List;
import java.util.Map;

public interface PromptBuilderService {
    PromptInput buildPrompt(String intent, Map<String, Object> structuredResult, String userMessage, List<Map<String, Object>> history);
}
