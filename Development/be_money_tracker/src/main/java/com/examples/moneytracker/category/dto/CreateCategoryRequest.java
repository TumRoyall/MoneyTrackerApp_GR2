package com.examples.moneytracker.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a custom category.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryRequest {

    @NotBlank(message = "Category name is required")
    private String name;

    @NotBlank(message = "Icon is required")
    private String icon;

    @NotBlank(message = "Color is required")
    private String color;

    @NotBlank(message = "Type is required")
    @Pattern(regexp = "^(EXPENSE|INCOME)$", message = "Type must be EXPENSE or INCOME")
    private String type;

    // Optional groupId for custom categories (defaults to "custom")
    private String groupId;
}
