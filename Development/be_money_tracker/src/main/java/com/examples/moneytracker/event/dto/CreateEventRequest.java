package com.examples.moneytracker.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class CreateEventRequest {
    @NotBlank(message = "Event name is required")
    @Size(max = 100, message = "Event name must be less than 100 characters")
    private String name;

    @Size(max = 50, message = "Icon must be less than 50 characters")
    private String icon;

    private String description;

    private Instant startDate;

    private Instant endDate;
}