package com.examples.moneytracker.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
public class AiActionRequest {
    @NotBlank
    private String text;
    private List<MessageDto> history;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageDto {
        private String role;
        private String message;
        private long createdAt;
    }
}
