package com.examples.moneytracker.ai.controller;

import com.examples.moneytracker.ai.dto.AiBudgetDraftRequest;
import com.examples.moneytracker.ai.dto.AiBudgetDraftResponse;
import com.examples.moneytracker.ai.service.AiBudgetService;
import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/budget")
@RequiredArgsConstructor
public class AiBudgetController {

    private final AiBudgetService aiBudgetService;

    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<AiBudgetDraftResponse>> generateDraft(
            @RequestBody @Valid AiBudgetDraftRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(aiBudgetService.generateDraft(request, user.getId())));
    }
}
