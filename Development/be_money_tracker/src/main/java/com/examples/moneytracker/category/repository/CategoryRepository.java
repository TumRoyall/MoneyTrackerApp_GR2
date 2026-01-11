package com.examples.moneytracker.category.repository;

import com.examples.moneytracker.category.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * Lấy toàn bộ category cho user:
     *  - category mặc định (isDefault = true)
     *  - category user tạo (userId = ?)
     */
    List<Category> findByIsDefaultTrueOrUserId(Long userId);

    /**
     * Lấy category theo type (EXPENSE / INCOME) cho user
     */
    List<Category> findByTypeAndIsDefaultTrueOrTypeAndUserId(
            String type,
            Long userId
    );

    /**
     * Lấy 1 category nhưng đảm bảo:
     *  - hoặc là category mặc định
     *  - hoặc là category của user
     */
    Optional<Category> findByCategoryIdAndIsDefaultTrueOrCategoryIdAndUserId(
            Long categoryId,
            Long userId
    );

    /**
     * Check category có thuộc user không (KHÔNG cho default)
     */
    boolean existsByCategoryIdAndUserId(Long categoryId, Long userId);
}
