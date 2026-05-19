package com.examples.moneytracker.insights.controller;

import com.examples.moneytracker.analytics.dto.BehaviorSignalDto;
import com.examples.moneytracker.analytics.service.BehaviorSignalService;
import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import com.examples.moneytracker.insights.dto.InsightResponse;
import com.examples.moneytracker.insights.service.InsightGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightController {

    private final BehaviorSignalService behaviorSignalService;
    private final InsightGenerationService insightGenerationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<InsightResponse>>> list(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(30);
        List<BehaviorSignalDto> signals = behaviorSignalService.detectSignals(user.getId(), start, end);
        return ResponseEntity.ok(ApiResponse.of(
                insightGenerationService.generate(signals)
        ));
    }
}
