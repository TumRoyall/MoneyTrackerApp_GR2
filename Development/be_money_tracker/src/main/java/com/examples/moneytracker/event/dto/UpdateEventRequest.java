package com.examples.moneytracker.event.dto;

import com.examples.moneytracker.event.model.EventStatus;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateEventRequest {
    @Size(max = 100, message = "Event name must be less than 100 characters")
    private String name;

    @Size(max = 50, message = "Icon must be less than 50 characters")
    private String icon;

    private String description;

    private java.time.Instant startDate;

    private java.time.Instant endDate;
}