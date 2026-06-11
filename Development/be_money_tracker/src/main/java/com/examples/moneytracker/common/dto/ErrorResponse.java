package com.examples.moneytracker.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@AllArgsConstructor
public class ErrorResponse {
    private ErrorDetail error;

    @Data
    @AllArgsConstructor
    public static class ErrorDetail {
        private String code;
        private String message;
        private Map<String, Object> details;
        private Instant timestamp;
    }
}
