package com.examples.moneytracker.budget.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "budget_categories")
@Data
@NoArgsConstructor
public class BudgetCategory {

    @EmbeddedId
    private BudgetCategoryId id;

    public BudgetCategory(UUID budgetId, UUID categoryId) {
        this.id = new BudgetCategoryId(budgetId, categoryId);
    }

    @Embeddable
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BudgetCategoryId implements Serializable {
        @Column(name = "budget_id")
        private UUID budgetId;

        @Column(name = "category_id")
        private UUID categoryId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            BudgetCategoryId that = (BudgetCategoryId) o;
            return Objects.equals(budgetId, that.budgetId) && Objects.equals(categoryId, that.categoryId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(budgetId, categoryId);
        }
    }
}
