package com.examples.moneytracker.sync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncOperation {
    private Integer outboxId;
    
    @NotBlank(message = "Request ID is required")
    private String requestId;
    
    @NotBlank(message = "Entity is required")
    @Pattern(regexp = "wallets|categories|transactions|budgets|user_profiles", 
             message = "Entity must be one of: wallets, categories, transactions, budgets, user_profiles")
    private String entity;
    
    @NotBlank(message = "Entity ID is required")
    private String entityId;
    
    @NotBlank(message = "Operation is required")
    @Pattern(regexp = "UPSERT|DELETE", message = "Operation must be UPSERT or DELETE")
    private String op;
    
    private Long baseVersion;
    private Map<String, Object> data;
    private Long deletedAt;
}
