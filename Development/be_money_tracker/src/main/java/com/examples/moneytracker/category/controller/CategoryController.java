package com.examples.moneytracker.category.controller;

import com.examples.moneytracker.category.dto.CategoryResponse;
import com.examples.moneytracker.category.service.CategoryService;
import com.examples.moneytracker.auth.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    // GET /api/categories
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(
                categoryService.getAccessibleCategories(user.getId())
        );
    }

    // GET /api/categories/{id}
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategory(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(
                categoryService.getCategoryById(user.getId(), id)
        );
    }
}
