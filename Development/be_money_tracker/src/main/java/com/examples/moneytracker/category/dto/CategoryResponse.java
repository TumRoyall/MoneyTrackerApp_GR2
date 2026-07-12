package com.examples.moneytracker.category.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private UUID categoryId;
    private String groupId;
    private String name;
    private String icon;
    private String color;
    private String type; // EXPENSE / INCOME
    private Boolean isDefault;
    private Boolean isHidden;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant deletedAt;
    private Long version;
}