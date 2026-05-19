package com.examples.moneytracker.analytics.controller;

import com.examples.moneytracker.analytics.dto.BehaviorSignalDto;
import com.examples.moneytracker.analytics.service.BehaviorSignalService;
import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/behavior")
@RequiredArgsConstructor
public class BehaviorSignalController {

    private final BehaviorSignalService behaviorSignalService;

    @GetMapping("/signals")
    public ResponseEntity<ApiResponse<List<BehaviorSignalDto>>> signals(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(30);
        return ResponseEntity.ok(ApiResponse.of(
                behaviorSignalService.detectSignals(user.getId(), start, end)
        ));
    }
}
