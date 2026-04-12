package com.examples.moneytracker.category.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCategoryRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String type; // EXPENSE / INCOME

    private String icon;
    private String color;
}
