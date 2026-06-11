package com.examples.moneytracker.user.dto;

import com.examples.moneytracker.user.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class UserResponse {
    private UUID userId;
    private String email;
    private String fullName;

    public static UserResponse from(User user) {
        return new UserResponse(user.getUserId(), user.getEmail(), user.getFullName());
    }
}
