package com.examples.moneytracker.auth.dto;

import com.examples.moneytracker.user.dto.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthLoginResponse {
    private String token;
    private UserResponse user;
}
