package com.examples.moneytracker.auth.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private Long userId;
    private String email;
    private String fullname;
}
