package com.examples.moneytracker.category.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.category.dto.CategoryResponse;
import com.examples.moneytracker.category.dto.CreateCategoryRequest;
import com.examples.moneytracker.category.service.CategoryService;
import com.examples.moneytracker.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

/**
 * REST API for categories.
 * - GET endpoints: accessible for both default and user-created categories
 * - POST endpoint: create custom categories (userId = current user)
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    // GET /api/categories
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(categoryService.getAccessibleCategories(user.getId())));
    }

    // GET /api/categories/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategory(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(categoryService.getCategoryById(user.getId(), id)));
    }

    // POST /api/categories - Create custom category
    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.of(categoryService.createCategory(user.getId(), request)));
    }
}