package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.analytics.dto.AnalyticsSummaryDto;
import com.examples.moneytracker.analytics.dto.BehaviorSignalDto;
import com.examples.moneytracker.analytics.service.AnalyticsService;
import com.examples.moneytracker.analytics.service.BehaviorSignalService;
import com.examples.moneytracker.budget.dto.BudgetResponse;
import com.examples.moneytracker.budget.service.BudgetService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CoachingService {

    private final AnalyticsService analyticsService;
    private final BehaviorSignalService behaviorSignalService;
    private final BudgetService budgetService;

    @Data
    @AllArgsConstructor
    public static class CoachingResult {
        private String advice;
        private Map<String, Object> metrics;
        private List<String> suggestions;
    }

    public CoachingResult generateAdvice(UUID userId, String userMessage) {
        AnalyticsSummaryDto summary = analyticsService.monthlySummary(userId, LocalDate.now());
        List<BehaviorSignalDto> signals = behaviorSignalService.detectSignals(userId, LocalDate.now().minusDays(30), LocalDate.now());
        List<BudgetResponse> budgets = budgetService.listBudgets(userId);

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalIncome", summary.getTotalIncome());
        metrics.put("totalExpense", summary.getTotalExpense());
        metrics.put("topCategory", summary.getTopCategoryName());
        metrics.put("topCategoryAmount", summary.getTopCategoryAmount());
        metrics.put("budgetCount", budgets.size());
        metrics.put("signalCount", signals.size());

        List<String> adviceItems = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        if (summary.getTotalExpense().compareTo(BigDecimal.ZERO) == 0) {
            adviceItems.add("Bạn chưa có dữ liệu chi tiêu. Hãy bắt đầu ghi nhận để được tư vấn tốt hơn.");
            suggestions.add("Ghi chi tiêu đầu tiên");
            return new CoachingResult(String.join(" ", adviceItems), metrics, suggestions);
        }

        BigDecimal expenseIncomeRatio = summary.getTotalIncome().compareTo(BigDecimal.ZERO) > 0
                ? summary.getTotalExpense().divide(summary.getTotalIncome(), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        if (expenseIncomeRatio.compareTo(new BigDecimal("1.0")) > 0) {
            adviceItems.add("Chi tiêu của bạn đang vượt thu nhập. Hãy xem xét cắt giảm các khoản không cần thiết.");
            suggestions.add("Đặt ngân sách cho tháng tới");
            suggestions.add("Xem báo cáo chi tiêu");
        } else if (expenseIncomeRatio.compareTo(new BigDecimal("0.7")) >= 0) {
            adviceItems.add("Bạn đang chi tiêu khá cao so với thu nhập. Còn khoảng " + (100 - expenseIncomeRatio.multiply(new BigDecimal("100")).intValue()) + "% để tiết kiệm.");
            suggestions.add("Đặt mục tiêu tiết kiệm");
            suggestions.add("Xem danh mục chi nhiều nhất");
        } else {
            adviceItems.add("Tình hình tài chính của bạn đang khá ổn định. Hãy tiếp tục duy trì thói quen này!");
            suggestions.add("Tăng mục tiêu tiết kiệm");
            suggestions.add("Khám phá công cụ đầu tư");
        }

        if (budgets.isEmpty()) {
            adviceItems.add("Bạn chưa có ngân sách nào. Thiết lập ngân sách giúp kiểm soát chi tiêu hiệu quả hơn.");
            suggestions.add(0, "Tạo ngân sách mới");
        } else {
            long nearLimitCount = budgets.stream()
                    .filter(b -> {
                        BigDecimal ratio = b.getAmountLimit().compareTo(BigDecimal.ZERO) > 0
                                ? b.getSpentAmount().divide(b.getAmountLimit(), 2, RoundingMode.HALF_UP)
                                : BigDecimal.ZERO;
                        return ratio.compareTo(new BigDecimal("0.8")) >= 0;
                    })
                    .count();
            if (nearLimitCount > 0) {
                adviceItems.add("Có " + nearLimitCount + " ngân sách sắp đạt giới hạn.");
                suggestions.add("Xem ngân sách của tôi");
            }
        }

        if (!signals.isEmpty()) {
            BehaviorSignalDto topSignal = signals.get(0);
            String signalAdvice = switch (topSignal.getType()) {
                case "WEEKEND_SPIKE" -> "Bạn có xu hướng chi tiêu cuối tuần cao hơn ngày thường.";
                case "HIGH_CATEGORY_CONCENTRATION" -> "Chi tiêu của bạn tập trung nhiều vào một danh mục.";
                case "LARGE_TRANSACTION_ANOMALY" -> "Có giao dịch lớn bất thường trong kỳ.";
                case "NO_RECENT_INCOME" -> "Bạn chưa có khoản thu nhập nào gần đây.";
                default -> null;
            };
            if (signalAdvice != null) {
                adviceItems.add(signalAdvice);
            }
        }

        if (summary.getTotalIncome().compareTo(BigDecimal.ZERO) == 0 && summary.getTotalExpense().compareTo(BigDecimal.ZERO) > 0) {
            adviceItems.add("Hãy cân nhắc tạo nguồn thu nhập hoặc ghi nhận thu nhập định kỳ.");
        }

        if (suggestions.size() > 3) {
            suggestions = suggestions.subList(0, 3);
        }

        return new CoachingResult(String.join(" ", adviceItems), metrics, suggestions);
    }
}
