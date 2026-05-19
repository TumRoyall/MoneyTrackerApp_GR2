package com.examples.moneytracker.analytics.service;

import com.examples.moneytracker.analytics.dto.AnalyticsSummaryDto;
import com.examples.moneytracker.transaction.model.Transaction;
import com.examples.moneytracker.transaction.repository.TransactionRepository;
import com.examples.moneytracker.transaction.spec.TransactionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DefaultAnalyticsService implements AnalyticsService {

    private final TransactionRepository transactionRepository;

    @Override
    public AnalyticsSummaryDto monthlySummary(UUID userId, LocalDate now) {
        LocalDate start = now.withDayOfMonth(1);
        LocalDate end = now;

        List<Transaction> txs = transactionRepository.findAll(
                TransactionSpecification.reportFilter(userId, start, end),
                Sort.by(Sort.Direction.DESC, "date")
        );

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        Map<String, BigDecimal> expenseByCategory = new HashMap<>();

        for (Transaction tx : txs) {
            String type = tx.getCategory().getType();
            if ("INCOME".equalsIgnoreCase(type)) {
                totalIncome = totalIncome.add(tx.getAmount());
            } else if ("EXPENSE".equalsIgnoreCase(type)) {
                totalExpense = totalExpense.add(tx.getAmount());
                String catName = tx.getCategory().getName();
                expenseByCategory.merge(catName, tx.getAmount(), BigDecimal::add);
            }
        }

        String topCategoryName = "unknown";
        BigDecimal topAmount = BigDecimal.ZERO;
        for (Map.Entry<String, BigDecimal> entry : expenseByCategory.entrySet()) {
            if (entry.getValue().compareTo(topAmount) > 0) {
                topAmount = entry.getValue();
                topCategoryName = entry.getKey();
            }
        }

        return new AnalyticsSummaryDto(
                start,
                end,
                totalIncome,
                totalExpense,
                topCategoryName,
                topAmount
        );
    }
}
