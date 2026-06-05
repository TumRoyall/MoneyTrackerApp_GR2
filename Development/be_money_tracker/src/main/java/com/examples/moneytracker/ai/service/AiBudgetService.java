package com.examples.moneytracker.ai.service;

import com.examples.moneytracker.ai.dto.AiBudgetDraftRequest;
import com.examples.moneytracker.ai.dto.AiBudgetDraftResponse;
import com.examples.moneytracker.ai.dto.AiTextResult;
import com.examples.moneytracker.ai.dto.BudgetItemDto;
import com.examples.moneytracker.ai.dto.BudgetSummaryDto;
import com.examples.moneytracker.ai.dto.PromptInput;
import com.examples.moneytracker.ai.provider.AiProviderGateway;
import com.examples.moneytracker.ai.validation.BudgetDraftValidator;
import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiBudgetService {

    private final AiProviderGateway aiProviderGateway;
    private final BudgetDraftValidator validator;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;

    public AiBudgetDraftResponse generateDraft(AiBudgetDraftRequest request, UUID userId) {
        // 1. Build category map (only EXPENSE categories for budget allocation)
        List<Category> categories = categoryRepository.findAccessibleCategories(userId);
        Map<UUID, String> nameById = categories.stream()
                .filter(c -> "EXPENSE".equalsIgnoreCase(c.getType()))
                .collect(Collectors.toMap(Category::getCategoryId, Category::getName));

        // 2. Build prompt (inline for MVP — no separate BudgetPromptBuilder)
        String prompt = buildPrompt(
                request.getIncome(),
                request.getUserPrompt(),
                request.getWalletId(),
                request.getPeriodStart(),
                request.getPeriodEnd(),
                nameById
        );

        // 3. Call Gemini
        AiTextResult result = aiProviderGateway.generateText(new PromptInput(prompt, List.of()));
        if (result == null || result.getText() == null || result.getText().isBlank()) {
            throw new RuntimeException("AI service unavailable");
        }

        // 4. Parse JSON
        List<BudgetItemDto> rawItems = parseItems(result.getText());
        String strategy = parseStrategy(result.getText());

        // 5. Validate (filter, clamp, ensure savings, cap 6, rebalance to 100, compute amounts)
        List<BudgetItemDto> validated = validator.validate(rawItems, nameById, request.getIncome());

        // 6. Build summary
        int totalPercent = validated.stream().mapToInt(BudgetItemDto::getPercent).sum();
        BigDecimal totalBudget = validated.stream()
                .map(BudgetItemDto::getAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BudgetItemDto savings = validated.stream()
                .filter(i -> "Tiết kiệm".equals(i.getCategoryName()))
                .findFirst()
                .orElse(null);
        BudgetSummaryDto summary = new BudgetSummaryDto(
                request.getIncome(),
                totalPercent,
                totalBudget,
                savings == null ? 0 : savings.getPercent(),
                savings == null ? BigDecimal.ZERO : savings.getAmount(),
                strategy == null ? "AI tạo ngân sách theo thu nhập" : strategy
        );

        return new AiBudgetDraftResponse(UUID.randomUUID(), validated, summary);
    }

    private String buildPrompt(
            BigDecimal income,
            String userPrompt,
            UUID walletId,
            java.time.LocalDate periodStart,
            java.time.LocalDate periodEnd,
            Map<UUID, String> availableCategories
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("# ROLE\n");
        sb.append("Bạn là trợ lý tài chính cá nhân. Phân bổ ngân sách tháng cho user.\n\n");

        sb.append("# QUY TẮC BẮT BUỘC\n");
        sb.append("1. CHỈ sử dụng categoryId từ AVAILABLE_CATEGORIES. Không tạo category mới.\n");
        sb.append("2. Trả về PERCENT (số nguyên 0-100) cho mỗi category.\n");
        sb.append("3. Tổng tất cả percent PHẢI BẰNG CHÍNH XÁC 100.\n");
        sb.append("4. LUÔN bao gồm category \"Tiết kiệm\" trong output.\n");
        sb.append("5. Tối đa 6 categories (khuyến nghị 4-5).\n");
        sb.append("6. Mỗi category có aiReasoning (1 câu ngắn, tiếng Việt).\n\n");

        sb.append("# CONTEXT\n");
        sb.append("- Income: ").append(income).append(" VND\n");
        sb.append("- Period: ").append(periodStart).append(" → ").append(periodEnd).append("\n");
        if (walletId != null) {
            sb.append("- Wallet scope: walletId=").append(walletId).append("\n");
        } else {
            sb.append("- Wallet scope: ALL wallets\n");
        }
        if (userPrompt != null && !userPrompt.isBlank()) {
            sb.append("- User request: ").append(userPrompt.trim()).append("\n");
        }
        sb.append("- Baseline: 50/30/20 (50 needs, 30 wants, 20 savings) — dùng khi user mới chưa có lịch sử.\n\n");

        sb.append("# AVAILABLE_CATEGORIES (only use these categoryId values)\n");
        for (Map.Entry<UUID, String> e : availableCategories.entrySet()) {
            sb.append("- ").append(e.getKey()).append(" → ").append(e.getValue()).append("\n");
        }
        sb.append("\n");

        sb.append("# OUTPUT FORMAT (JSON only, không giải thích thêm)\n");
        sb.append("{\n");
        sb.append("  \"items\": [\n");
        sb.append("    { \"categoryId\": \"uuid\", \"percent\": 25, \"aiReasoning\": \"Lý do ngắn\" }\n");
        sb.append("  ],\n");
        sb.append("  \"summary\": { \"strategy\": \"Mô tả chiến lược (1-2 câu)\" }\n");
        sb.append("}");

        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private List<BudgetItemDto> parseItems(String raw) {
        try {
            String json = extractJsonBlock(raw);
            Map<String, Object> parsed = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
            List<Map<String, Object>> itemsRaw = (List<Map<String, Object>>) parsed.getOrDefault("items", List.of());
            List<BudgetItemDto> items = new ArrayList<>();
            for (Map<String, Object> m : itemsRaw) {
                UUID catId = m.get("categoryId") != null ? UUID.fromString(m.get("categoryId").toString()) : null;
                int percent = ((Number) m.getOrDefault("percent", 0)).intValue();
                String reasoning = m.get("aiReasoning") == null ? null : m.get("aiReasoning").toString();
                items.add(new BudgetItemDto(catId, null, percent, BigDecimal.ZERO, reasoning));
            }
            return items;
        } catch (Exception ex) {
            throw new RuntimeException("Failed to parse AI response: " + ex.getMessage(), ex);
        }
    }

    @SuppressWarnings("unchecked")
    private String parseStrategy(String raw) {
        try {
            String json = extractJsonBlock(raw);
            Map<String, Object> parsed = objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
            if (parsed.get("summary") instanceof Map<?, ?> s) {
                Object s2 = ((Map<String, Object>) s).get("strategy");
                return s2 == null ? null : s2.toString();
            }
            return null;
        } catch (Exception ex) {
            return null;
        }
    }

    private String extractJsonBlock(String raw) {
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start == -1 || end == -1 || end <= start) {
            throw new IllegalArgumentException("No JSON object in AI response");
        }
        return raw.substring(start, end + 1);
    }
}
