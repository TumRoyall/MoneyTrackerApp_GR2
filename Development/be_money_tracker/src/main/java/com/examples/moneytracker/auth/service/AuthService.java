package com.examples.moneytracker.auth.service;

import com.examples.moneytracker.auth.dto.*;
import com.examples.moneytracker.auth.email.EmailService;
import com.examples.moneytracker.auth.jwt.JwtProvider;
import com.examples.moneytracker.user.model.User;
import com.examples.moneytracker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder;
    private final JwtProvider jwtProvider;
    private final EmailService emailService;

    @Value("${app.url}")
    private String appUrl;

    public void register(RegisterRequest req) {

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email này đã tồn tại");
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setFullName(req.getFullname());
        user.setPasswordHash(encoder.encode(req.getPassword()));
        user.setProvider("local"); // đăng nhặp bằng tài khoản mật khẩu cơ bản
        user.setIsVerified(false);

        // Tạo token để xác thực email
        String token = generateVerificationToken();
        user.setVerificationToken(token);
        user.setVerificationSentAt(Instant.now());

        userRepository.save(user);

        // send mail kèm token để xác thực
        String verifyLink = appUrl + "/api/auth/verify?token=" + token;
        String logoUrl = appUrl + "/logo_money_tracker.png";

        String html = emailService.buildVerifyEmail(user.getFullName(), verifyLink, logoUrl);

        emailService.send(
                user.getEmail(),
                "Verify your MoneyTracker account",
                html
        );
    }


    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại!"));

        if (!encoder.matches(req.getPassword(), user.getPasswordHash()))
            throw new RuntimeException("Mật khẩu không chính xác");

        String token = jwtProvider.genarationToken(user.getUserId(), user.getEmail());

        AuthResponse res = new AuthResponse();
        res.setToken(token);
        res.setUserId(user.getUserId());
        res.setEmail(user.getEmail());
        res.setFullname(user.getFullName());

        return res;
    }

    private String generateVerificationToken() {
        return java.util.UUID.randomUUID().toString();
    }

    public String verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Token đã hết hạn"));

        user.setIsVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        return "Xác thực Email thành công!";
    }

    public String resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        if (user.getIsVerified()) {
            return "Tài khoản đã được xác thực";
        }

        // chống gửi liên tục sau 60s
        if (user.getVerificationSentAt() != null &&
                user.getVerificationSentAt().isAfter(Instant.now().minusSeconds(60))) {
            throw new RuntimeException("Hãy chờ gửi lại xác thực sau 60s");
        }

        // tạo token mới
        String token = generateVerificationToken();
        user.setVerificationToken(token);
        user.setVerificationSentAt(Instant.now());
        userRepository.save(user);

        // send mail kèm token để xác thực
        String verifyLink = appUrl + "/api/auth/verify?token=" + token;
        String logoUrl = appUrl + "/logo_money_tracker.png";

        String html = emailService.buildVerifyEmail(user.getFullName(), verifyLink, logoUrl);

        emailService.send(
                user.getEmail(),
                "Hãy xác thực Email của bạn",
                html
        );

        return "Thư xác thực đã được gửi tới: "+ user.getEmail();
    }

    public boolean emailExists(String email) {
        return Boolean.TRUE.equals(userRepository.existsByEmail(email));
    }

}
