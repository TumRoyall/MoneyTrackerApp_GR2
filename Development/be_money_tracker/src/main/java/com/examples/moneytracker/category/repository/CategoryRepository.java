package com.examples.moneytracker.category.repository;

import com.examples.moneytracker.category.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

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
      AND c.isHidden = false
      AND c.deletedAt IS NULL
    """)
    Optional<Category> findAccessibleCategory(
            @Param("categoryId") UUID categoryId,
            @Param("userId") UUID userId
    );

    @Query("""
    SELECT c
    FROM Category c
    WHERE (c.isDefault = true OR c.userId = :userId)
      AND c.isHidden = false
      AND c.deletedAt IS NULL
    """)
    List<Category> findAccessibleCategories(@Param("userId") UUID userId);

    Optional<Category> findByCategoryIdAndUserIdAndDeletedAtIsNull(UUID categoryId, UUID userId);

    List<Category> findByUserIdAndCategoryIdInAndDeletedAtIsNull(UUID userId, Collection<UUID> categoryIds);

    List<Category> findByCategoryIdInAndDeletedAtIsNull(Collection<UUID> categoryIds);

    List<Category> findByUserIdAndDeletedAtIsNotNull(UUID userId);

    @Query("""
    SELECT c
    FROM Category c
    WHERE (c.isDefault = true OR c.userId = :userId)
      AND c.deletedAt IS NULL
    """)
    List<Category> findSyncCategories(@Param("userId") UUID userId);

    @Query("SELECT c FROM Category c WHERE c.categoryId = :categoryId AND c.deletedAt IS NULL")
    Optional<Category> findByCategoryIdRaw(@Param("categoryId") UUID categoryId);

    @Query("SELECT c FROM Category c WHERE c.categoryId IN :categoryIds AND c.deletedAt IS NULL")
    List<Category> findByCategoryIdInRaw(@Param("categoryIds") Collection<UUID> categoryIds);
}