package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.AiActionMeta;
import com.examples.moneytracker.ai.dto.AiActionResponse;
import com.examples.moneytracker.ai.dto.AiTextResult;
import com.examples.moneytracker.ai.dto.IntentResult;
import com.examples.moneytracker.ai.enums.IntentType;
import com.examples.moneytracker.ai.provider.AiProviderGateway;
import com.examples.moneytracker.analytics.dto.AnalyticsSummaryDto;
import com.examples.moneytracker.analytics.dto.BehaviorSignalDto;
import com.examples.moneytracker.analytics.service.AnalyticsService;
import com.examples.moneytracker.analytics.service.BehaviorSignalService;
import com.examples.moneytracker.budget.dto.BudgetResponse;
import com.examples.moneytracker.budget.service.BudgetService;
import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.insights.dto.InsightResponse;
import com.examples.moneytracker.insights.service.InsightGenerationService;
import com.examples.moneytracker.transaction.dto.CreateTransactionRequest;
import com.examples.moneytracker.transaction.dto.ParsedTransactionDto;
import com.examples.moneytracker.transaction.dto.TransactionResponse;
import com.examples.moneytracker.transaction.service.TransactionParsingService;
import com.examples.moneytracker.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiActionService {

    private final IntentDetectionService intentDetectionService;
    private final TransactionParsingService transactionParsingService;
    private final TransactionService transactionService;
    private final AnalyticsService analyticsService;
    private final BehaviorSignalService behaviorSignalService;
    private final InsightGenerationService insightGenerationService;
    private final BudgetService budgetService;
    private final PromptBuilderService promptBuilderService;
    private final AiProviderGateway aiProviderGateway;

    public AiActionResponse handleAction(String text, UUID userId) {
        IntentResult intentResult = intentDetectionService.detectIntent(text);
        IntentType intent = intentResult.getIntent();

        Map<String, Object> structured = new HashMap<>();
        String fallbackMessage;
        List<String> suggestions = List.of();
        boolean aiFallbackUsed = false;
        String aiProvider = "gemini";

        try {
            switch (intent) {
                case LOG_TRANSACTION -> {
                    ParsedTransactionDto parsed = transactionParsingService.parse(text, userId);
                    CreateTransactionRequest req = new CreateTransactionRequest();
                    req.setWalletId(parsed.getWalletId());
                    req.setCategoryId(parsed.getCategoryId());
                    req.setAmount(parsed.getAmount());
                    req.setNote(parsed.getNote());
                    req.setDate(parsed.getDate() != null ? parsed.getDate() : LocalDate.now());

                    TransactionResponse created = transactionService.create(req, userId);
                    structured.put("transactionId", created.getTransactionId());
                    structured.put("amount", created.getAmount());
                    structured.put("categoryId", created.getCategoryId());

                    fallbackMessage = "Recorded transaction.";
                }
                case SPENDING_QUERY -> {
                    AnalyticsSummaryDto summary = analyticsService.monthlySummary(userId, LocalDate.now());
                    structured.put("summary", summary);
                    if (summary.getTotalExpense().compareTo(java.math.BigDecimal.ZERO) == 0) {
                        fallbackMessage = "No spending data for this month.";
                    } else {
                        fallbackMessage = "You spent the most on " + summary.getTopCategoryName() + " this month.";
                    }
                }
                case BUDGET_QUERY -> {
                    Optional<Category> category = transactionParsingService.resolveCategory(text, userId);
                    List<BudgetResponse> budgets = budgetService.listBudgets(userId);
                    BudgetResponse match = null;
                    if (category.isPresent()) {
                        for (BudgetResponse budget : budgets) {
                            if (budget.getCategoryIds() != null && budget.getCategoryIds().contains(category.get().getCategoryId())) {
                                match = budget;
                                break;
                            }
                        }
                    }

                    if (match != null) {
                        structured.put("budgetId", match.getBudgetId());
                        structured.put("remaining", match.getRemainingAmount());
                        structured.put("categoryId", match.getCategoryId());
                        fallbackMessage = "Remaining budget: " + match.getRemainingAmount();
                    } else {
                        structured.put("budgetId", null);
                        fallbackMessage = "No matching budget found.";
                        suggestions = List.of("Try: remaining budget for food", "Try: budget an uong");
                    }
                }
                case INSIGHT_REQUEST -> {
                    List<BehaviorSignalDto> signals = behaviorSignalService.detectSignals(userId, LocalDate.now().minusDays(30), LocalDate.now());
                    List<InsightResponse> insights = insightGenerationService.generate(signals);
                    structured.put("insights", insights);
                    fallbackMessage = insights.isEmpty() ? "No insight available yet." : insights.get(0).getMessage();
                }
                default -> {
                    fallbackMessage = "I can help log transactions or answer spending questions.";
                    suggestions = List.of("Try: an pho 45k", "Try: chi nhieu nhat thang nay", "Try: budget an uong");
                }
            }
        } catch (IllegalArgumentException ex) {
            intent = IntentType.UNKNOWN;
            structured.put("error", ex.getMessage());
            fallbackMessage = "I could not process that. Please try again.";
            suggestions = List.of("Try: an pho 45k", "Try: chi nhieu nhat thang nay");
        }

        FormatResult formatResult = formatResponse(intent, structured, text, fallbackMessage);
        String message = formatResult.message;
        aiProvider = formatResult.provider;
        aiFallbackUsed = formatResult.fallbackUsed;

        AiActionMeta meta = new AiActionMeta(
                intentResult.getConfidence(),
                aiProvider,
                aiFallbackUsed,
                suggestions
        );

        return new AiActionResponse(intent.name(), structured, message, meta);
    }

    private FormatResult formatResponse(IntentType intent, Map<String, Object> structured, String userMessage, String fallbackMessage) {
        AiTextResult aiText = aiProviderGateway.generateText(
                promptBuilderService.buildPrompt(intent.name(), structured, userMessage)
        );

        if (aiText.getText() == null || aiText.getText().isBlank()) {
            return new FormatResult(fallbackMessage, aiText.getProvider(), true);
        }

        return new FormatResult(aiText.getText().trim(), aiText.getProvider(), false);
    }

    private static class FormatResult {
        private final String message;
        private final String provider;
        private final boolean fallbackUsed;

        private FormatResult(String message, String provider, boolean fallbackUsed) {
            this.message = message;
            this.provider = provider;
            this.fallbackUsed = fallbackUsed;
        }
    }
}
