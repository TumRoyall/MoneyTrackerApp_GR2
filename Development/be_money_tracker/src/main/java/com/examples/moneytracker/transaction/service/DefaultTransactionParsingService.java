package com.examples.moneytracker.transaction.service;

import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.category.repository.CategoryRepository;
import com.examples.moneytracker.transaction.dto.ParsedTransactionDto;
import com.examples.moneytracker.wallet.model.Wallet;
import com.examples.moneytracker.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class DefaultTransactionParsingService implements TransactionParsingService {

    private static final Pattern AMOUNT_PATTERN = Pattern.compile("(?i)(\\d+[.,]?\\d*)\\s*(k|ngan|nghin|tr|trieu|m|million)?");

    private final CategoryRepository categoryRepository;
    private final WalletRepository walletRepository;

    @Override
    public ParsedTransactionDto parse(String text, UUID userId) {
        BigDecimal amount = parseAmount(text)
                .orElseThrow(() -> new IllegalArgumentException("Amount not found"));

        Optional<Category> category = resolveCategory(text, userId);
        if (category.isEmpty()) {
            throw new IllegalArgumentException("Category not found");
        }

        Wallet wallet = resolveWallet(text, userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found"));

        String note = normalizeNote(text, amount);

        return new ParsedTransactionDto(
                amount,
                wallet.getWalletId(),
                category.get().getCategoryId(),
                note,
                LocalDate.now()
        );
    }

    @Override
    public Optional<Category> resolveCategory(String text, UUID userId) {
        String lower = safeLower(text);
        List<Category> categories = categoryRepository.findAccessibleCategories(userId);

        for (Category category : categories) {
            String name = safeLower(category.getName());
            if (!name.isBlank() && lower.contains(name)) {
                return Optional.of(category);
            }
        }

        if (containsAny(lower, List.of("an", "pho", "bun", "com", "food", "cafe", "coffee", "tra", "sua"))) {
            for (Category category : categories) {
                String name = safeLower(category.getName());
                if (name.contains("an") || name.contains("uong") || name.contains("food") || name.contains("cafe")) {
                    return Optional.of(category);
                }
            }
        }

        for (Category category : categories) {
            if ("EXPENSE".equalsIgnoreCase(category.getType())) {
                return Optional.of(category);
            }
        }

        return categories.isEmpty() ? Optional.empty() : Optional.of(categories.get(0));
    }

    private Optional<Wallet> resolveWallet(String text, UUID userId) {
        List<Wallet> wallets = walletRepository.findByUserIdAndDeletedAtIsNull(userId);
        String lower = safeLower(text);

        for (Wallet wallet : wallets) {
            String name = safeLower(wallet.getName());
            if (!name.isBlank() && lower.contains(name)) {
                return Optional.of(wallet);
            }
        }

        return wallets.isEmpty() ? Optional.empty() : Optional.of(wallets.get(0));
    }

    private Optional<BigDecimal> parseAmount(String text) {
        Matcher matcher = AMOUNT_PATTERN.matcher(text == null ? "" : text);
        if (!matcher.find()) {
            return Optional.empty();
        }

        String raw = matcher.group(1).replace(",", ".");
        BigDecimal value = new BigDecimal(raw);
        String suffix = matcher.group(2);
        if (suffix != null) {
            String normalized = suffix.toLowerCase(Locale.ROOT);
            if (normalized.equals("k") || normalized.equals("ngan") || normalized.equals("nghin")) {
                value = value.multiply(BigDecimal.valueOf(1000));
            } else if (normalized.equals("tr") || normalized.equals("trieu") || normalized.equals("m") || normalized.equals("million")) {
                value = value.multiply(BigDecimal.valueOf(1000000));
            }
        }

        return Optional.of(value);
    }

    private String normalizeNote(String text, BigDecimal amount) {
        if (text == null) {
            return null;
        }
        String cleaned = text.replace(amount.toPlainString(), "");
        return cleaned.trim();
    }

    private boolean containsAny(String text, List<String> keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }
}
