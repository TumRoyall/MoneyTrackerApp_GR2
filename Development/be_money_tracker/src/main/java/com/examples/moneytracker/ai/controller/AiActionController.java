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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        List<Map<String, Object>> history = request.getHistory() != null
                ? request.getHistory().stream()
                    .map(msg -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("role", msg.getRole());
                        map.put("message", msg.getMessage());
                        map.put("createdAt", msg.getCreatedAt());
                        return map;
                    })
                    .toList()
                : List.of();

        return ResponseEntity.ok(ApiResponse.of(
                aiActionService.handleAction(request.getText(), user.getId(), history)
        ));
    }
}
