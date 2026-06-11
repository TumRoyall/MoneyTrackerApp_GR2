package com.examples.moneytracker.transaction.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import com.examples.moneytracker.transaction.dto.ParsedTransactionDto;
import com.examples.moneytracker.transaction.service.TransactionParsingService;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionParseController {

    private final TransactionParsingService parsingService;

    @PostMapping("/parse")
    public ResponseEntity<ApiResponse<ParsedTransactionDto>> parse(
            @RequestBody ParseRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(
                parsingService.parse(request.getText(), user.getId())
        ));
    }

    @Data
    public static class ParseRequest {
        @NotBlank
        private String text;
    }
}
