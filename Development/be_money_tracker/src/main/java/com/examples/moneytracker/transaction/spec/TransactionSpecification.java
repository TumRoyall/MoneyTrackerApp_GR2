package com.examples.moneytracker.transaction.spec;

import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.transaction.model.Transaction;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class TransactionSpecification {

    // ===== USER (BẮT BUỘC) =====
    public static Specification<Transaction> hasUser(UUID userId) {
        return (root, query, cb) ->
                cb.equal(root.get("createdBy"), userId);
    }

    // ===== ACCOUNT =====
    public static Specification<Transaction> hasAccount(UUID accountId) {
        return (root, query, cb) ->
                accountId == null
                        ? cb.conjunction()
                        : cb.equal(root.get("accountId"), accountId);
    }

    // ===== CATEGORY =====
    public static Specification<Transaction> hasCategory(UUID categoryId) {
        return (root, query, cb) -> {
            if (categoryId == null)
                return cb.conjunction();

            Join<Transaction, Category> category =
                    root.join("category", JoinType.INNER);

            return cb.equal(category.get("categoryId"), categoryId);
        };
    }

    // ===== TYPE (INCOME / EXPENSE – case insensitive) =====
    public static Specification<Transaction> hasType(String type) {
        return (root, query, cb) -> {
            if (type == null || type.isBlank())
                return cb.conjunction();

            Join<Transaction, Category> category =
                    root.join("category", JoinType.INNER);

            return cb.equal(
                    cb.lower(category.get("type")),
                    type.trim().toLowerCase()
            );
        };
    }

    // ===== FROM DATE =====
    public static Specification<Transaction> fromDate(LocalDate fromDate) {
        return (root, query, cb) ->
                fromDate == null
                        ? cb.conjunction()
                        : cb.greaterThanOrEqualTo(root.get("date"), fromDate);
    }

    // ===== TO DATE =====
    public static Specification<Transaction> toDate(LocalDate toDate) {
        return (root, query, cb) ->
                toDate == null
                        ? cb.conjunction()
                        : cb.lessThanOrEqualTo(root.get("date"), toDate);
    }

    // ===== MIN AMOUNT =====
    public static Specification<Transaction> minAmount(BigDecimal minAmount) {
        return (root, query, cb) ->
                minAmount == null
                        ? cb.conjunction()
                        : cb.greaterThanOrEqualTo(root.get("amount"), minAmount);
    }

    // ===== MAX AMOUNT =====
    public static Specification<Transaction> maxAmount(BigDecimal maxAmount) {
        return (root, query, cb) ->
                maxAmount == null
                        ? cb.conjunction()
                        : cb.lessThanOrEqualTo(root.get("amount"), maxAmount);
    }

    // ===== KEYWORD (NOTE) =====
    public static Specification<Transaction> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank())
                return cb.conjunction();

            return cb.like(
                    cb.lower(cb.coalesce(root.get("note"), "")),
                    "%" + keyword.trim().toLowerCase() + "%"
            );
        };
    }

    // ===== COMPOSE ALL =====
    public static Specification<Transaction> filter(
            UUID userId,
            UUID accountId,
            UUID categoryId,
            String type,
            LocalDate fromDate,
            LocalDate toDate,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            String keyword
    ) {
        return Specification
                .where(hasUser(userId))
                .and(hasAccount(accountId))
                .and(hasCategory(categoryId))
                .and(hasType(type))
                .and(fromDate(fromDate))
                .and(toDate(toDate))
                .and(minAmount(minAmount))
                .and(maxAmount(maxAmount))
                .and(hasKeyword(keyword));
    }
}
