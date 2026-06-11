package com.examples.moneytracker.streak.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import com.examples.moneytracker.streak.dto.RecordActivityResponse;
import com.examples.moneytracker.streak.dto.StreakResponse;
import com.examples.moneytracker.streak.service.StreakService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/streaks")
@RequiredArgsConstructor
public class StreakController {

    private final StreakService streakService;

    @GetMapping
    public ResponseEntity<ApiResponse<StreakResponse>> getStreak(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(streakService.getStreak(user.getId())));
    }

    @PostMapping("/activity")
    public ResponseEntity<ApiResponse<RecordActivityResponse>> recordActivity(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(streakService.recordActivity(user.getId())));
    }
}
