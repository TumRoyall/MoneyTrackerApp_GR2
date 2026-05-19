package com.examples.moneytracker.ai.provider;

import com.examples.moneytracker.ai.dto.AiTextResult;
import com.examples.moneytracker.ai.dto.PromptInput;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
public class GeminiProvider implements AiProviderGateway {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.gemini.apiKey:}")
    private String apiKey;

    @Value("${ai.gemini.model:gemini-1.5-flash}")
    private String model;

    @Override
    public AiTextResult generateText(PromptInput input) {
        if (apiKey == null || apiKey.isBlank()) {
            return new AiTextResult("gemini", null);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

            GeminiRequest payload = new GeminiRequest(
                    List.of(new Content(List.of(new Part(input.getText()))))
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<GeminiRequest> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<GeminiResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    GeminiResponse.class
            );

            if (response.getBody() == null || response.getBody().getCandidates() == null) {
                return new AiTextResult("gemini", null);
            }

            String text = response.getBody().firstText();
            return new AiTextResult("gemini", text);
        } catch (Exception ex) {
            return new AiTextResult("gemini", null);
        }
    }

    @Data
    private static class GeminiRequest {
        private final List<Content> contents;
    }

    @Data
    private static class Content {
        private final List<Part> parts;
    }

    @Data
    private static class Part {
        private final String text;
    }

    @Data
    private static class GeminiResponse {
        private List<Candidate> candidates;

        public String firstText() {
            if (candidates == null || candidates.isEmpty()) {
                return null;
            }
            Candidate candidate = candidates.get(0);
            if (candidate.content == null || candidate.content.parts == null || candidate.content.parts.isEmpty()) {
                return null;
            }
            return candidate.content.parts.get(0).text;
        }
    }

    @Data
    private static class Candidate {
        private Content content;
    }
}
