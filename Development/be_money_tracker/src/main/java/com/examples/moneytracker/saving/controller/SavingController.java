package com.examples.moneytracker.saving.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import com.examples.moneytracker.saving.dto.CreateSavingRequest;
import com.examples.moneytracker.saving.dto.SavingResponse;
import com.examples.moneytracker.saving.dto.UpdateSavingRequest;
import com.examples.moneytracker.saving.service.SavingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/savings")
@RequiredArgsConstructor
public class SavingController {

    private final SavingService savingService;

    @PostMapping
    public ResponseEntity<ApiResponse<SavingResponse>> createSaving(
            @RequestBody @Valid CreateSavingRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(savingService.createSaving(request, user.getId())));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavingResponse>>> listSavings(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(savingService.listSavings(user.getId())));
    }

    @GetMapping("/{savingId}")
    public ResponseEntity<ApiResponse<SavingResponse>> getSaving(
            @PathVariable UUID savingId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(savingService.getSaving(savingId, user.getId())));
    }

    @PutMapping("/{savingId}")
    public ResponseEntity<ApiResponse<SavingResponse>> updateSaving(
            @PathVariable UUID savingId,
            @RequestBody @Valid UpdateSavingRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(savingService.updateSaving(savingId, request, user.getId())));
    }

    @DeleteMapping("/{savingId}")
    public ResponseEntity<Void> deleteSaving(
            @PathVariable UUID savingId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        savingService.deleteSaving(savingId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
