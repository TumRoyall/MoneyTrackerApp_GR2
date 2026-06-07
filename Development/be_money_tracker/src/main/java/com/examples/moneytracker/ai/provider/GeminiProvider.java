package com.examples.moneytracker.ai.provider;

import com.examples.moneytracker.ai.dto.AiTextResult;
import com.examples.moneytracker.ai.dto.PromptInput;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
public class GeminiProvider implements AiProviderGateway {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.gemini.apiKey:}")
    private String apiKey;

    @Value("${ai.gemini.model:gemini-1.5-flash}")
    private String model;

    /**
     * Mock mode toggle. When true, return a canned response without calling Gemini.
     * Set via property `ai.gemini.mock=true` in application.properties, or
     * env `AI_GEMINI_MOCK=true` (Spring relaxed binding).
     * Useful when Gemini is rate-limited/unavailable and you need to test the UI.
     */
    @Value("${ai.gemini.mock:false}")
    private boolean mockMode;

    // Canned mock response for AI Budget Draft. The structure mirrors what
    // Gemini would return wrapped in ```json ... ``` so extractJsonBlock() works.
    private static final String MOCK_BUDGET_RESPONSE = "```json\n" +
            "{\n" +
            "  \"items\": [\n" +
            "    { \"categoryId\": \"b9fb7cd3-7cdb-4c54-a535-5de5967fc07f\", \"percent\": 30, \"aiReasoning\": \"Phân bổ cho các chi phí nhà ở thiết yếu như tiền thuê nhà hoặc hóa đơn sinh hoạt.\" },\n" +
            "    { \"categoryId\": \"15fa9da9-ffde-4733-b680-f661dfcaeea7\", \"percent\": 15, \"aiReasoning\": \"Chi phí hàng ngày cho thực phẩm và nhu yếu phẩm, là một phần quan trọng của ngân sách.\" },\n" +
            "    { \"categoryId\": \"d3515c92-8d4a-450b-bff2-ca978d744c18\", \"percent\": 5, \"aiReasoning\": \"Bao gồm chi phí đi lại, xăng xe hoặc phương tiện công cộng.\" },\n" +
            "    { \"categoryId\": \"51000312-9bd7-4fb7-a9b8-461801dee18a\", \"percent\": 20, \"aiReasoning\": \"Phần trăm này được dành cho tiết kiệm và đầu tư vào bản thân hoặc tương lai.\" },\n" +
            "    { \"categoryId\": \"9ee77c64-1b50-413a-aadc-d667a51b4a21\", \"percent\": 20, \"aiReasoning\": \"Dành cho các hoạt động giải trí, sở thích và chi tiêu cá nhân để nâng cao chất lượng cuộc sống.\" },\n" +
            "    { \"categoryId\": \"1a96a257-3c1c-4cf1-bed8-679a2af20dc3\", \"percent\": 10, \"aiReasoning\": \"Chi phí cho việc chăm sóc sức khỏe, tập luyện hoặc các dịch vụ liên quan đến thể chất và tinh thần.\" }\n" +
            "  ],\n" +
            "  \"summary\": { \"strategy\": \"Chiến lược này áp dụng nguyên tắc 50/30/20, tập trung vào các nhu cầu thiết yếu (50%), phân bổ cho sở thích cá nhân (30%), và một phần đáng kể cho tiết kiệm/đầu tư tương lai (20%).\" }\n" +
            "}\n" +
            "```";

    @Override
    public AiTextResult generateText(PromptInput input) {
        if (mockMode) {
            return new AiTextResult("gemini-mock", MOCK_BUDGET_RESPONSE);
        }
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

            // Capture raw response (String) so HTTP errors don't throw and lose the body.
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            String rawBody = response.getBody();
            if (rawBody == null || rawBody.isBlank()) {
                return new AiTextResult("gemini", null);
            }

            GeminiResponse parsed = objectMapper.readValue(rawBody, GeminiResponse.class);
            if (parsed.getCandidates() == null) {
                return new AiTextResult("gemini", null);
            }
            String text = parsed.firstText();
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
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class Content {
        private List<Part> parts;

        public Content(List<Part> parts) {
            this.parts = parts;
        }
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class Part {
        private String text;

        public Part(String text) {
            this.text = text;
        }
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
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
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class Candidate {
        private Content content;
    }
}
