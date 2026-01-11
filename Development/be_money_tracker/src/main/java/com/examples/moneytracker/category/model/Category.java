package com.examples.moneytracker.category.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "categories")
@Data
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long categoryId;

    /**
     * NULL  -> category mặc định (system)
     * != NULL -> category của user
     */
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String name;

    /**
     * EXPENSE / INCOME
     */
    @Column(nullable = false)
    private String type;

    private String icon;

    private String color;

    /**
     * true  -> category mặc định
     * false -> category user tạo
     */
    @Column(nullable = false)
    private Boolean isDefault = false;
}
