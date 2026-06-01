package com.examples.moneytracker.sync.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class CategoryPushData {
    private String name;
    private String type; // EXPENSE / INCOME
    private String icon;
    private String color;
    private Boolean isDefault;
    private Boolean isHidden;
    private Long version;
    private Long createdAt;
    private Long updatedAt;
    private Long deletedAt;
}
