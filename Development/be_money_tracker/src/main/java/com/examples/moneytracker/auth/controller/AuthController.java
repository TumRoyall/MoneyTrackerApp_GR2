package com.examples.moneytracker.auth.controller;

import com.examples.moneytracker.auth.dto.*;
import com.examples.moneytracker.auth.service.AuthService;
import com.examples.moneytracker.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.examples.moneytracker.auth.security.CustomUserDetails;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<MessageResponse>> register(@RequestBody @Valid RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok(ApiResponse.of(new MessageResponse("Da gui yeu cau xac thuc den email")));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthLoginResponse>> login(@RequestBody @Valid LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.of(authService.login(req)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<MessageResponse>> logout() {
        return ResponseEntity.ok(ApiResponse.of(new MessageResponse(authService.logout())));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<MessageResponse>> changePassword(
            @RequestBody @Valid ChangePasswordRequest request,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        String message = authService.changePassword(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.of(new MessageResponse(message)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<MessageResponse>> forgotPassword(
            @RequestBody @Valid ForgotPasswordRequest request
    ) {
        String message = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.of(new MessageResponse(message)));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<MessageResponse>> resetPassword(
            @RequestBody @Valid ResetPasswordRequest request
    ) {
        String message = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.of(new MessageResponse(message)));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<MessageResponse>> verifyEmail(@RequestParam String token) {
        String message = authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.of(new MessageResponse(message)));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<MessageResponse>> resendVerification(
            @RequestBody @Valid ResendVerificationRequest request
    ) {
        String message = authService.resendVerification(request.getEmail());
        return ResponseEntity.ok(ApiResponse.of(new MessageResponse(message)));
    }

    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkEmail(@RequestParam String email) {
        boolean exists = authService.emailExists(email);
        return ResponseEntity.ok(ApiResponse.of(Map.of("exists", exists)));
    }
}
