package com.examples.moneytracker.event.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class JoinEventRequest {
    private String shareCode;
}