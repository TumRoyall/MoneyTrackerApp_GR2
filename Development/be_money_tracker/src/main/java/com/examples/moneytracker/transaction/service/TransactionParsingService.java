package com.examples.moneytracker.transaction.service;

import com.examples.moneytracker.category.model.Category;
import com.examples.moneytracker.transaction.dto.ParsedTransactionDto;

import java.util.Optional;
import java.util.UUID;

public interface TransactionParsingService {
    ParsedTransactionDto parse(String text, UUID userId);
    Optional<Category> resolveCategory(String text, UUID userId);
}
