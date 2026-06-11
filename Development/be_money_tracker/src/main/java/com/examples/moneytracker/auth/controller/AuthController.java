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

    @GetMapping(value = "/verify-email", produces = "text/html; charset=UTF-8")
    public ResponseEntity<String> verifyEmail(@RequestParam String token) {
        try {
            String message = authService.verifyEmail(token);
            return ResponseEntity.ok(buildHtmlResponse(true, message));
        } catch (Exception e) {
            return ResponseEntity.ok(buildHtmlResponse(false, e.getMessage()));
        }
    }

    private String buildHtmlResponse(boolean success, String message) {
        String icon = success ? "✅" : "❌";
        String title = success ? "Xác thực thành công" : "Xác thực thất bại";
        
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%%; }
                    .icon { font-size: 64px; margin-bottom: 20px; }
                    h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
                    p { color: #666; font-size: 16px; margin-bottom: 30px; line-height: 1.5; }
                    .btn { display: inline-block; background-color: #4da3ff; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; transition: background 0.3s; }
                    .btn:hover { background-color: #3182ce; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">%s</div>
                    <h1>%s</h1>
                    <p>%s</p>
                    <!-- Sẽ mở app MoneyTracker nếu máy có cài app, hoặc mở trang web -->
                    <a href="moneytracker://" class="btn">Mở ứng dụng MoneyTracker</a>
                </div>
            </body>
            </html>
            """.formatted(title, icon, title, message);
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
