package com.examples.moneytracker.ai.provider;

import com.examples.moneytracker.ai.dto.AiTextResult;
import com.examples.moneytracker.ai.dto.PromptInput;

public interface AiProviderGateway {
    AiTextResult generateText(PromptInput input);
}
