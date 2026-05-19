package com.examples.moneytracker.ai.controller;

import com.examples.moneytracker.ai.dto.AiActionRequest;
import com.examples.moneytracker.ai.dto.AiActionResponse;
import com.examples.moneytracker.ai.service.AiActionService;
import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiActionController {

    private final AiActionService aiActionService;

    @PostMapping("/action")
    public ResponseEntity<ApiResponse<AiActionResponse>> action(
            @RequestBody @Valid AiActionRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(
                aiActionService.handleAction(request.getText(), user.getId())
        ));
    }
}
