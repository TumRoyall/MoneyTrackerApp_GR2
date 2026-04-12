package com.examples.moneytracker.auth.email;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void send(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Gửi Email bị lỗi : " + e.getMessage());
        }
    }


    public String buildVerifyEmail(String fullName, String verifyLink, String logoUrl) {
        return """
    <div style="font-family: Arial, sans-serif; background-color: #eef3f9; padding: 0; margin: 0;">
        <table align="center" width="100%%" style="max-width: 600px; background: #ffffff; 
                border-radius: 12px; overflow: hidden; margin-top: 32px;">
            
            <!-- Header -->
            <tr>
                <td style="background-color: #4da3ff; text-align: center; padding: 24px;">
                    <img src="%s" alt="MoneyTracker Logo" style="width: 100px; height: auto;">
                </td>
            </tr>

            <!-- Body -->
            <tr>
                <td style="padding: 28px;">
                    <h2 style="color: #2a2a2a; margin-bottom: 12px; text-align: center;">
                        Xác thực tài khoản MoneyTracker
                    </h2>

                    <p style="color: #444; font-size: 15px;">
                        Xin chào <strong>%s</strong>,
                    </p>

                    <p style="color: #444; font-size: 15px; line-height: 1.5;">
                        Nhấn nút bên dưới để xác thực email và kích hoạt tài khoản MoneyTracker.
                    </p>

                    <!-- BUTTON ONLY -->
                    <div style="text-align: center; margin: 36px 0;">
                        <a href="%s"
                           style="background-color: #4da3ff; color: white; padding: 14px 32px; 
                                  text-decoration: none; font-size: 16px; border-radius: 8px;
                                  display: inline-block; font-weight: bold;">
                            XÁC THỰC EMAIL
                        </a>
                    </div>

                    <p style="color: #888; font-size: 13px; text-align: center;">
                        © MoneyTracker – Ứng dụng quản lý chi tiêu cá nhân thông minh
                    </p>
                </td>
            </tr>
        </table>
    </div>
    """.formatted(logoUrl, fullName, verifyLink);
    }

    public String buildResetPasswordEmail(String fullName, String resetLink) {
        return """
    <div style="font-family: Arial, sans-serif; background-color: #eef3f9; padding: 0; margin: 0;">
        <table align="center" width="100%%" style="max-width: 600px; background: #ffffff;
                border-radius: 12px; overflow: hidden; margin-top: 32px;">
            <tr>
                <td style="padding: 28px;">
                    <h2 style="color: #2a2a2a; margin-bottom: 12px; text-align: center;">
                        Dat lai mat khau MoneyTracker
                    </h2>

                    <p style="color: #444; font-size: 15px;">
                        Xin chao <strong>%s</strong>,
                    </p>

                    <p style="color: #444; font-size: 15px; line-height: 1.5;">
                        Nhan nut ben duoi de dat lai mat khau.
                    </p>

                    <div style="text-align: center; margin: 36px 0;">
                        <a href="%s"
                           style="background-color: #4da3ff; color: white; padding: 14px 32px;
                                  text-decoration: none; font-size: 16px; border-radius: 8px;
                                  display: inline-block; font-weight: bold;">
                            DAT LAI MAT KHAU
                        </a>
                    </div>

                    <p style="color: #888; font-size: 13px; text-align: center;">
                        © MoneyTracker – Ung dung quan ly chi tieu ca nhan thong minh
                    </p>
                </td>
            </tr>
        </table>
    </div>
    """.formatted(fullName, resetLink);
    }
}
