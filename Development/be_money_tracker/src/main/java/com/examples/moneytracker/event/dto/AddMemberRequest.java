package com.examples.moneytracker.event.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request to add a new guest member to an event (OWNER only).
 * Xem ADR-007: email làm unique identifier cho guest trong cùng event.
 */
@Data
public class AddMemberRequest {

    @NotBlank(message = "Tên thành viên không được để trống")
    @Size(max = 100, message = "Tên không được vượt quá 100 ký tự")
    private String guestName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 255)
    private String guestEmail;
}