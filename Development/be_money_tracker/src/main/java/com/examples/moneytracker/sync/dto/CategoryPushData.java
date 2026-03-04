package com.examples.moneytracker.sync.dto;

import lombok.Data;

@Data
public class CategoryPushData {
    private String name;
    private String type; // EXPENSE / INCOME
    private String icon;
    private String color;
    private Boolean isDefault;
    private Long version;
    private Long createdAt;
    private Long updatedAt;
    private Long deletedAt;
}
