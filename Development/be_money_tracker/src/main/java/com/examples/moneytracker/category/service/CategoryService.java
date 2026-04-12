package com.examples.moneytracker.category.service;

import com.examples.moneytracker.category.dto.CategoryResponse;
import com.examples.moneytracker.category.dto.CreateCategoryRequest;
import com.examples.moneytracker.category.dto.UpdateCategoryRequest;
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

    @Transactional
    public CategoryResponse createCategory(UUID userId, CreateCategoryRequest request) {
        Category category = new Category();
        category.setUserId(userId);
        category.setName(request.getName());
        category.setType(request.getType());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setIsDefault(false);
        category.setIsHidden(false);

        categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse updateCategory(UUID userId, UUID categoryId, UpdateCategoryRequest request) {
        Category category = categoryRepository.findByCategoryIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            category.setName(request.getName());
        }
        if (request.getIcon() != null) {
            category.setIcon(request.getIcon());
        }
        if (request.getColor() != null) {
            category.setColor(request.getColor());
        }

        categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public void hideCategory(UUID userId, UUID categoryId) {
        Category category = categoryRepository.findByCategoryIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (Boolean.TRUE.equals(category.getIsDefault())) {
            throw new IllegalArgumentException("Default category cannot be hidden");
        }

        category.setIsHidden(true);
        categoryRepository.save(category);
    }
}
