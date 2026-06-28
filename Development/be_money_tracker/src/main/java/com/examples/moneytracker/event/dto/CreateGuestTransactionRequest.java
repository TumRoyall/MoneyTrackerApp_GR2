package com.examples.moneytracker.event.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class CreateGuestTransactionRequest {
    @NotBlank(message = "Creator name is required")
    @Size(max = 100)
    private String creatorName;

    /**
     * Email của guest — dùng để auto-promote thành member (xem ADR-007 + ADR-008).
     * Nếu email đã tồn tại trong event → gộp vào member đó.
     * Optional để giữ backward compat với các client cũ; nếu null thì không tạo member.
     */
    @Email(message = "Email không hợp lệ")
    @Size(max = 255)
    private String creatorEmail;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotBlank(message = "Category is required")
    private String categoryId;

    private String categoryName;

    private String categoryIcon;

    private String note;

    private Instant date;
}