package com.examples.moneytracker.garden.service.score;

import com.examples.moneytracker.budget.model.Budget;
import com.examples.moneytracker.budget.model.BudgetCategory;
import com.examples.moneytracker.budget.repository.BudgetCategoryRepository;
import com.examples.moneytracker.budget.repository.BudgetRepository;
import com.examples.moneytracker.garden.model.DailyFinancialTask;
import com.examples.moneytracker.garden.model.FinancialTaskStatus;
import com.examples.moneytracker.garden.repository.DailyFinancialTaskRepository;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.transaction.spec.TransactionSpecification;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.model.WalletType;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScoreContextFactory {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetCategoryRepository budgetCategoryRepository;
    private final DailyFinancialTaskRepository taskRepository;

    @Transactional
    public ScoreContext build(UUID userId, LocalDate start, LocalDate end) {
        if (start == null || end == null || start.isAfter(end)) {
            throw new IllegalArgumentException("Invalid scoring period");
        }

        List<Transaction> transactions = transactionRepository.findAll(
            TransactionSpecification.reportFilter(userId, start, end)
        );

        Set<UUID> walletIds = transactions.stream()
            .map(Transaction::getWalletId)
            .collect(Collectors.toCollection(HashSet::new));

        Map<UUID, WalletType> walletTypes = walletRepository
            .findByUserIdAndWalletIdInAndDeletedAtIsNull(userId, walletIds)
            .stream()
            .collect(Collectors.toMap(Wallet::getWalletId, Wallet::getType));

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        BigDecimal savingsContribution = BigDecimal.ZERO;
        BigDecimal debtPayment = BigDecimal.ZERO;
        BigDecimal debtIncrease = BigDecimal.ZERO;
        Map<LocalDate, BigDecimal> dailyExpenseTotals = new HashMap<>();
        Map<String, BigDecimal> expenseByCategory = new HashMap<>();

        for (Transaction tx : transactions) {
            String type = tx.getCategory().getType();
            BigDecimal amount = tx.getAmount();
            if ("INCOME".equalsIgnoreCase(type)) {
                totalIncome = totalIncome.add(amount);
            } else if ("EXPENSE".equalsIgnoreCase(type)) {
                totalExpense = totalExpense.add(amount);
                dailyExpenseTotals.merge(tx.getDate(), amount, BigDecimal::add);
                String key = normalizeCategoryName(tx.getCategory().getName());
                expenseByCategory.merge(key, amount, BigDecimal::add);
            }

            WalletType walletType = walletTypes.get(tx.getWalletId());
            if (walletType == WalletType.SAVING) {
                savingsContribution = savingsContribution.add(
                    "INCOME".equalsIgnoreCase(type) ? amount : amount.negate()
                );
            }
            if (walletType == WalletType.DEBT) {
                if ("EXPENSE".equalsIgnoreCase(type)) {
                    debtPayment = debtPayment.add(amount);
                } else if ("INCOME".equalsIgnoreCase(type)) {
                    debtIncrease = debtIncrease.add(amount);
                }
            }
        }

        BigDecimal savingsRatio = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal positiveSavings = savingsContribution.max(BigDecimal.ZERO);
            savingsRatio = positiveSavings
                .divide(totalIncome, 6, RoundingMode.HALF_UP);
        }

        List<Budget> budgets = budgetRepository.findByUserIdAndDeletedAtIsNull(userId);
        Map<UUID, List<UUID>> budgetCategories = loadBudgetCategories(budgets);
        List<ScoreContext.BudgetUsage> budgetUsages = buildBudgetUsage(budgets, budgetCategories, transactions, start, end);

        List<DailyFinancialTask> tasks = taskRepository.findByUserIdAndTaskDateBetween(userId, start, end);
        int totalTasks = tasks.size();
        int completedTasks = (int) tasks.stream()
            .filter(task -> task.getStatus() == FinancialTaskStatus.COMPLETED)
            .count();

        return new ScoreContext(
            userId,
            start,
            end,
            totalIncome,
            totalExpense,
            savingsContribution,
            debtPayment,
            debtIncrease,
            savingsRatio,
            dailyExpenseTotals,
            expenseByCategory,
            budgetUsages,
            totalTasks,
            completedTasks
        );
    }

    private Map<UUID, List<UUID>> loadBudgetCategories(List<Budget> budgets) {
        List<UUID> budgetIds = budgets.stream()
            .map(Budget::getBudgetId)
            .toList();
        List<BudgetCategory> all = budgetCategoryRepository.findByIdBudgetIdIn(budgetIds);
        return all.stream()
            .collect(Collectors.groupingBy(
                item -> item.getId().getBudgetId(),
                Collectors.mapping(item -> item.getId().getCategoryId(), Collectors.toList())
            ));
    }

    private List<ScoreContext.BudgetUsage> buildBudgetUsage(
        List<Budget> budgets,
        Map<UUID, List<UUID>> budgetCategories,
        List<Transaction> transactions,
        LocalDate periodStart,
        LocalDate periodEnd
    ) {
        List<ScoreContext.BudgetUsage> usages = new ArrayList<>();
        for (Budget budget : budgets) {
            LocalDate overlapStart = periodStart.isAfter(budget.getPeriodStart())
                ? periodStart
                : budget.getPeriodStart();
            LocalDate overlapEnd = periodEnd.isBefore(budget.getPeriodEnd())
                ? periodEnd
                : budget.getPeriodEnd();
            if (overlapStart.isAfter(overlapEnd)) {
                continue;
            }
            List<UUID> categories = budgetCategories.getOrDefault(budget.getBudgetId(), List.of());
            BigDecimal spent = BigDecimal.ZERO;
            for (Transaction tx : transactions) {
                if (!tx.getWalletId().equals(budget.getWalletId())) {
                    continue;
                }
                if (!"EXPENSE".equalsIgnoreCase(tx.getCategory().getType())) {
                    continue;
                }
                if (!categories.contains(tx.getCategory().getCategoryId())) {
                    continue;
                }
                LocalDate txDate = tx.getDate();
                if (txDate.isBefore(overlapStart) || txDate.isAfter(overlapEnd)) {
                    continue;
                }
                spent = spent.add(tx.getAmount());
            }
            usages.add(new ScoreContext.BudgetUsage(
                budget.getBudgetId(),
                budget.getAmountLimit(),
                spent
            ));
        }
        return usages;
    }

    private String normalizeCategoryName(String name) {
        if (name == null) {
            return "";
        }
        return name.trim().toLowerCase();
    }
}
