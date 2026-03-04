package com.examples.moneytracker.auth.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class AuthResponse {
    private String token;
    private UUID userId;
    private String email;
    private String fullname;
}
