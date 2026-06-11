package com.examples.moneytracker.category.service;

import com.examples.moneytracker.category.dto.CategoryResponse;
import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Categories are static system data seeded at boot by
 * {@link com.examples.moneytracker.category.seed.DefaultCategoriesSeeder}.
 * Only read-only access is exposed; create/update/hide was removed because
 * the client no longer manages custom categories.
 */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    private CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
                .categoryId(c.getCategoryId())
                .name(c.getName())
                .icon(c.getIcon())
                .color(c.getColor())
                .type(c.getType())
                .isDefault(c.getIsDefault())
                .isHidden(c.getIsHidden())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .deletedAt(c.getDeletedAt())
                .version(c.getVersion())
                .build();
    }

    /**
     * List categories mà user "nhìn thấy":
     * - category default (isDefault=true)
     * - category do user tạo (userId = currentUserId)
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAccessibleCategories(UUID userId) {
        return categoryRepository.findAccessibleCategories(userId).stream()
            .map(this::toResponse)
            .toList();
    }

    /**
     * Get 1 category nếu user được quyền truy cập (default hoặc thuộc user)
     */
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(UUID userId, UUID categoryId) {
        Category c = categoryRepository.findAccessibleCategory(categoryId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found or not accessible"));
        return toResponse(c);
    }
}