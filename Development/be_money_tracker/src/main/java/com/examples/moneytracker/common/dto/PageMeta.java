package com.examples.moneytracker.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PageMeta {
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;
}
