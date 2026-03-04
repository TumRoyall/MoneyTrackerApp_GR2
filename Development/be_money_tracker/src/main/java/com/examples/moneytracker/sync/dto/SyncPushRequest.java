package com.examples.moneytracker.sync.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncPushRequest {
    @NotBlank(message = "Device ID is required")
    private String deviceId;
    
    @NotNull(message = "Client time is required")
    private Long clientTime;
    
    @NotEmpty(message = "Operations list cannot be empty")
    @Valid
    private List<SyncOperation> operations;
}
