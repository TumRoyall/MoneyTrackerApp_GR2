package com.examples.moneytracker.budget.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.budget.dto.BudgetResponse;
import com.examples.moneytracker.budget.dto.CreateBudgetRequest;
import com.examples.moneytracker.budget.dto.UpdateBudgetRequest;
import com.examples.moneytracker.budget.service.BudgetService;
import com.examples.moneytracker.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> createBudget(
            @RequestBody @Valid CreateBudgetRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(budgetService.createBudget(request, user.getId())));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> listBudgets(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(budgetService.listBudgets(user.getId())));
    }

    @GetMapping("/{budgetId}")
    public ResponseEntity<ApiResponse<BudgetResponse>> getBudget(
            @PathVariable UUID budgetId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(budgetService.getBudget(budgetId, user.getId())));
    }

    @PutMapping("/{budgetId}")
    public ResponseEntity<ApiResponse<BudgetResponse>> updateBudget(
            @PathVariable UUID budgetId,
            @RequestBody @Valid UpdateBudgetRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(budgetService.updateBudget(budgetId, request, user.getId())));
    }

    @DeleteMapping("/{budgetId}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable UUID budgetId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        budgetService.deleteBudget(budgetId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
