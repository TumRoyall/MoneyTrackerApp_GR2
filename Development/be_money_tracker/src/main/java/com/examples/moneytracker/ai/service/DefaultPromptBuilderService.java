package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.PromptInput;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class DefaultPromptBuilderService implements PromptBuilderService {

    @Override
    public PromptInput buildPrompt(String intent, Map<String, Object> structuredResult, String userMessage) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a supportive finance companion. ");
        sb.append("Use only the structured result below for facts. ");
        sb.append("Do not invent numbers or categories. ");
        sb.append("Keep it short and calm.\n\n");
        sb.append("Intent: ").append(intent).append("\n");
        sb.append("User message: ").append(userMessage).append("\n");
        sb.append("Structured result: ").append(structuredResult).append("\n");
        sb.append("Reply in Vietnamese without accents and keep it to 1-2 sentences.");

        return new PromptInput(sb.toString());
    }
}
