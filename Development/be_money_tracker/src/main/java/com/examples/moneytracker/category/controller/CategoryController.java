package com.examples.moneytracker.category.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.category.dto.CategoryResponse;
import com.examples.moneytracker.category.service.CategoryService;
import com.examples.moneytracker.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

/**
 * Categories are static system data — ~139 rows seeded at boot by
 * {@link com.examples.moneytracker.category.seed.DefaultCategoriesSeeder}.
 * Clients cannot create/update/hide categories over the REST API; any change
 * to the category list requires shipping a new build with an updated
 * categoryIconGroups / CategoryGroups.
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
}