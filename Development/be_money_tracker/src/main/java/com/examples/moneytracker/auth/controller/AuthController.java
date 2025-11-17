package com.examples.moneytracker.auth.controller;

import com.examples.moneytracker.auth.dto.*;
import com.examples.moneytracker.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest req) {
        authService.register(req);
        return "Đã gửi yêu cầu xác thực đến Email: "+ req.getEmail();
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest req) {
        System.out.println("Đăng nhập thành công!");
        return authService.login(req);
    }

    @GetMapping("/verify")
    public String verify(@RequestParam String token) {
        return authService.verifyEmail(token);
    }

    @PostMapping("/resend")
    public String resend(@RequestParam String email) {
        return authService.resendVerification(email);
    }


}
