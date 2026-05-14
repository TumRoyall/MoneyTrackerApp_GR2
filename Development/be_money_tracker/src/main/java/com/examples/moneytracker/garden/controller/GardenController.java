package com.examples.moneytracker.garden.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import com.examples.moneytracker.garden.dto.*;
import com.examples.moneytracker.garden.service.GardenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/garden")
@RequiredArgsConstructor
public class GardenController {

    private final GardenService gardenService;

    /**
     * GET /api/garden/current — Main dashboard state.
     */
    @GetMapping("/current")
    public ResponseEntity<ApiResponse<GardenCurrentResponse>> getCurrentGarden(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(
            gardenService.getCurrentGarden(user.getId())
        ));
    }

    /**
     * GET /api/garden/flower-state — Flower visual state only.
     */
    @GetMapping("/flower-state")
    public ResponseEntity<ApiResponse<GardenFlowerStateResponse>> getFlowerState(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(
            gardenService.getFlowerState(user.getId())
        ));
    }

    /**
     * GET /api/garden/tasks/today — Daily tasks.
     */
    @GetMapping("/tasks/today")
    public ResponseEntity<ApiResponse<List<GardenTaskResponse>>> getTodayTasks(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(
            gardenService.getTodayTasks(user.getId())
        ));
    }

    /**
     * POST /api/garden/tasks/{taskId}/complete — Complete a task.
     */
    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<ApiResponse<List<GardenTaskResponse>>> completeTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(
            gardenService.completeTask(user.getId(), taskId)
        ));
    }

    /**
     * POST /api/garden/select-seed — Select a seed for the current month.
     */
    @PostMapping("/select-seed")
    public ResponseEntity<ApiResponse<GardenCurrentResponse>> selectSeed(
            @RequestBody @Valid SelectSeedRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(
            gardenService.selectSeed(user.getId(), request)
        ));
    }

    /**
     * GET /api/garden/history — Past months archive.
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<GardenHistoryResponse>>> getGardenHistory(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(
            gardenService.getGardenHistory(user.getId())
        ));
    }

    /**
     * GET /api/garden/month-report — Monthly report with timeline.
     */
    @GetMapping("/month-report")
    public ResponseEntity<ApiResponse<GardenMonthReportResponse>> getMonthReport(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(
            gardenService.getMonthReport(user.getId())
        ));
    }
}
