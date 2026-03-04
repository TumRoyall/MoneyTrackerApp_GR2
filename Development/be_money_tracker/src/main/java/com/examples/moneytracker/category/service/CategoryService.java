package com.examples.moneytracker.category.service;

import com.examples.moneytracker.category.dto.CategoryResponse;
import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

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
                .build();
    }

    /**
     * List categories mà user "nhìn thấy":
     * - category default (isDefault=true)
     * - category do user tạo (userId = currentUserId)
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAccessibleCategories(UUID userId) {
        // Chưa có query sẵn trong repo -> dùng findAll + filter (OK cho project nhỏ).
        // Nếu data lớn: tạo query riêng trong repository để filter thẳng DB.
        return categoryRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsDefault()) || (c.getUserId() != null && c.getUserId().equals(userId)))
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
