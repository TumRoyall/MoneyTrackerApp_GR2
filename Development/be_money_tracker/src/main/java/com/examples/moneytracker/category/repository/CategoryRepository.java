package com.examples.moneytracker.category.repository;

import com.examples.moneytracker.category.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * Lấy 1 category nhưng đảm bảo:
     *  - hoặc là category mặc định
     *  - hoặc là category của user
     */
    @Query("""
    SELECT c
    FROM Category c
    WHERE c.categoryId = :categoryId
      AND (
            c.isDefault = true
            OR c.userId = :userId
          )
    """)
        Optional<Category> findAccessibleCategory(
                @Param("categoryId") Long categoryId,
                @Param("userId") Long userId
        );


}
