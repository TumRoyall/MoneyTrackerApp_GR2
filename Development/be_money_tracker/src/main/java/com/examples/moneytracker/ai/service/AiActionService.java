package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.AiActionMeta;
import com.examples.moneytracker.ai.dto.AiActionResponse;
import com.examples.moneytracker.ai.dto.AiTextResult;
import com.examples.moneytracker.ai.provider.AiProviderGateway;
import com.examples.moneytracker.analytics.dto.AnalyticsSummaryDto;
import com.examples.moneytracker.analytics.dto.BehaviorSignalDto;
import com.examples.moneytracker.analytics.service.AnalyticsService;
import com.examples.moneytracker.analytics.service.BehaviorSignalService;
import com.examples.moneytracker.budget.dto.BudgetResponse;
import com.examples.moneytracker.budget.service.BudgetService;
import com.examples.moneytracker.insights.dto.InsightResponse;
import com.examples.moneytracker.insights.service.InsightGenerationService;
import com.examples.moneytracker.transaction.dto.ParsedTransactionDto;
import com.examples.moneytracker.transaction.service.TransactionParsingService;
import com.examples.moneytracker.wallet.dto.WalletResponse;
import com.examples.moneytracker.wallet.service.WalletService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AiActionService {

    private static final Pattern JSON_BLOCK = Pattern.compile(
            "---JSON---\\s*(\\{.*?\\})\\s*---END---",
            Pattern.DOTALL
    );
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?i)(\\d+[.,]?\\d*)\\s*(k|ngan|nghin|tr|trieu|m|million)?"
    );

    private final TransactionParsingService transactionParsingService;
    private final AnalyticsService analyticsService;
    private final BehaviorSignalService behaviorSignalService;
    private final InsightGenerationService insightGenerationService;
    private final BudgetService budgetService;
    private final WalletService walletService;
    private final AiProviderGateway aiProviderGateway;
    private final ObjectMapper objectMapper;

    public AiActionResponse handleAction(String text, UUID userId) {
        return handleAction(text, userId, List.of());
    }

    public AiActionResponse handleAction(String text, UUID userId, List<Map<String, Object>> history) {
        AnalyticsSummaryDto summary = analyticsService.monthlySummary(userId, LocalDate.now());
        List<BudgetResponse> budgets = budgetService.listBudgets(userId);
        List<WalletResponse> wallets = walletService.listWallets(userId);
        List<BehaviorSignalDto> signals = behaviorSignalService.detectSignals(
                userId, LocalDate.now().minusDays(30), LocalDate.now()
        );
        List<InsightResponse> insights = insightGenerationService.generate(signals);

        Map<String, Object> context = new HashMap<>();
        context.put("summary", summary);
        context.put("budgets", budgets);
        context.put("wallets", wallets);
        context.put("insights", insights);

        String prompt = buildPrompt(context, text, history);
        AiTextResult aiResult = aiProviderGateway.generateText(
                new com.examples.moneytracker.ai.dto.PromptInput(prompt, List.of())
        );

        String raw = aiResult.getText();
        if (raw == null || raw.isBlank()) {
            return fallbackResponse(text, userId, context);
        }

        MetaData meta = extractMeta(raw);
        String message = meta.cleanMessage;

        if (meta.intent.equals("transaction") || AMOUNT_PATTERN.matcher(text).find()) {
            try {
                ParsedTransactionDto parsed = transactionParsingService.parse(text, userId);
                Map<String, Object> txData = new HashMap<>();
                txData.put("amount", parsed.getAmount());
                txData.put("categoryId", parsed.getCategoryId());
                txData.put("walletId", parsed.getWalletId());
                txData.put("note", parsed.getNote());
                txData.put("date", parsed.getDate() != null ? parsed.getDate().toString() : LocalDate.now().toString());

                AiActionMeta actionMeta = new AiActionMeta(0.9, "gemini", false, meta.suggestions);
                return new AiActionResponse("LOG_TRANSACTION", txData, message, actionMeta);
            } catch (Exception ignored) {}
        }

        String intentName = switch (meta.intent) {
            case "spending" -> "SPENDING_QUERY";
            case "budget" -> "BUDGET_QUERY";
            case "insight" -> "INSIGHT_REQUEST";
            case "coaching" -> "COACHING";
            default -> "UNKNOWN";
        };

        Map<String, Object> structured = new HashMap<>();
        structured.put("summary", summary);
        structured.put("budgets", budgets);
        structured.put("wallets", wallets);
        structured.put("insights", insights);

        AiActionMeta actionMeta = new AiActionMeta(0.8, "gemini", false, meta.suggestions);
        return new AiActionResponse(intentName, structured, message, actionMeta);
    }

    private String buildPrompt(Map<String, Object> context, String text, List<Map<String, Object>> history) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là trợ lý tài chính thân thiện, nói tiếng Việt.\n");
        sb.append("Trả lời ngắn gọn, ấm áp, tối đa 3 câu.\n\n");

        if (history != null && !history.isEmpty()) {
            sb.append("Lịch sử gần đây:\n");
            int start = Math.max(0, history.size() - 6);
            for (int i = start; i < history.size(); i++) {
                Map<String, Object> msg = history.get(i);
                sb.append(msg.getOrDefault("role", "?")).append(": ")
                  .append(msg.getOrDefault("message", "")).append("\n");
            }
            sb.append("\n");
        }

        sb.append("Dữ liệu tài chính người dùng:\n");
        sb.append(context).append("\n\n");

        sb.append("Tin nhắn: ").append(text).append("\n\n");

        sb.append("Nhiệm vụ của bạn:\n");
        sb.append("1. Hiểu người dùng muốn gì (hỏi chi tiêu, tạo giao dịch, xem ngân sách, xin lời khuyên, hỏi về tính năng...)\n");
        sb.append("2. Trả lời tự nhiên, dùng dữ liệu bên trên nếu cần\n");
        sb.append("3. Nếu người dùng muốn ghi giao dịch (có số tiền + món), hãy xác nhận lại thông tin\n");
        sb.append("4. Cuối cùng, thêm dòng sau:\n");
        sb.append("---JSON---\n");
        sb.append("{\"intent\": \"transaction|spending|budget|insight|coaching|other\", \"suggestions\": [\"câu 1\", \"câu 2\"]}\n");
        sb.append("---END---\n");
        sb.append("Trong đó intent là thể loại chính: transaction (ghi giao dịch), spending (hỏi chi tiêu), budget (ngân sách), insight (phát hiện/gợi ý), coaching (lời khuyên/tư vấn), other (khác).\n");
        sb.append("suggestions là 2-3 gợi ý cho người dùng hỏi tiếp.");

        return sb.toString();
    }

    private MetaData extractMeta(String raw) {
        String intent = "other";
        List<String> suggestions = List.of();
        String cleanMessage = raw;

        Matcher matcher = JSON_BLOCK.matcher(raw);
        if (matcher.find()) {
            String json = matcher.group(1);
            cleanMessage = raw.substring(0, matcher.start()).trim();
            try {
                Map<String, Object> parsed = objectMapper.readValue(json,
                        new TypeReference<Map<String, Object>>() {});
                if (parsed.containsKey("intent")) {
                    intent = (String) parsed.get("intent");
                }
                if (parsed.containsKey("suggestions")) {
                    suggestions = ((List<?>) parsed.get("suggestions"))
                            .stream().map(Object::toString).toList();
                }
            } catch (Exception ignored) {}
        }

        if (intent.equals("other") && (raw.toLowerCase().contains("khuyên") || raw.toLowerCase().contains("tư vấn")
                || raw.toLowerCase().contains("nên") || raw.toLowerCase().contains("cách"))) {
            intent = "coaching";
        }

        return new MetaData(cleanMessage, intent, suggestions);
    }

    private AiActionResponse fallbackResponse(String text, UUID userId, Map<String, Object> context) {
        if (AMOUNT_PATTERN.matcher(text).find()) {
            try {
                ParsedTransactionDto parsed = transactionParsingService.parse(text, userId);
                Map<String, Object> txData = new HashMap<>();
                txData.put("amount", parsed.getAmount());
                txData.put("categoryId", parsed.getCategoryId());
                txData.put("walletId", parsed.getWalletId());
                txData.put("note", parsed.getNote());
                txData.put("date", parsed.getDate() != null ? parsed.getDate().toString() : LocalDate.now().toString());
                AiActionMeta meta = new AiActionMeta(0.7, "gemini", true,
                        List.of("Xác nhận", "Chỉnh sửa"));
                return new AiActionResponse("LOG_TRANSACTION", txData,
                        "Đã tạo bản nháp giao dịch.", meta);
            } catch (Exception ignored) {}
        }
        AiActionMeta meta = new AiActionMeta(0.3, "gemini", true,
                List.of("Tháng này chi nhiều nhất?", "Cho tôi lời khuyên", "Ghi chi tiêu"));
        return new AiActionResponse("UNKNOWN", context,
                "Tôi có thể giúp bạn theo dõi chi tiêu, đặt ngân sách, hoặc đưa lời khuyên tài chính. Bạn muốn làm gì?", meta);
    }

    private record MetaData(String cleanMessage, String intent, List<String> suggestions) {}
}