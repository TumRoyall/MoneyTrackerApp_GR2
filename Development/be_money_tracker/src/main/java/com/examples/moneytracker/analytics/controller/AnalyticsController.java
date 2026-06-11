package com.examples.moneytracker.analytics.controller;

import com.examples.moneytracker.analytics.dto.AnalyticsSummaryDto;
import com.examples.moneytracker.analytics.service.AnalyticsService;
import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AnalyticsSummaryDto>> summary(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) LocalDate date
    ) {
        LocalDate now = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.of(
                analyticsService.monthlySummary(user.getId(), now)
        ));
    }
}
