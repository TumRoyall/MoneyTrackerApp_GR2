package com.examples.moneytracker.category.service;

import com.examples.moneytracker.category.dto.CategoryResponse;
import com.examples.moneytracker.category.dto.CreateCategoryRequest;
import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Category service supporting both default system categories (seeded at boot)
 * and custom user-created categories.
 */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    private CategoryResponse toResponse(Category c) {
        return CategoryResponse.builder()
                .categoryId(c.getCategoryId())
                .groupId(c.getGroupId())
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

    /**
     * Create a custom category for the given user.
     * Custom categories have userId = currentUserId and isDefault = false.
     */
    @Transactional
    public CategoryResponse createCategory(UUID userId, CreateCategoryRequest request) {
        Category category = new Category();
        category.setCategoryId(UUID.randomUUID());
        category.setUserId(userId);
        category.setGroupId(request.getGroupId() != null ? request.getGroupId() : "custom");
        category.setName(request.getName());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setType(request.getType());
        category.setIsDefault(false);
        category.setIsHidden(false);
        category.setCreatedAt(Instant.now());
        category.setUpdatedAt(Instant.now());

        Category saved = categoryRepository.save(category);
        return toResponse(saved);
    }
}