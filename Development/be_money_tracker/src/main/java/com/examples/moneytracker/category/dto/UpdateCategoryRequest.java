package com.examples.moneytracker.category.dto;

import lombok.Data;

@Data
public class UpdateCategoryRequest {
    private String name;
    private String icon;
    private String color;
}
