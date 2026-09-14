package com.example.demo.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@serenity.ai}")
    private String fromEmail;

    public boolean sendVerificationOtpEmail(String toEmail, String otp) {
        String subject = "Verify your Serenity AI account";
        String htmlContent = buildEmailTemplate(
                "Welcome to Serenity AI 🌿",
                "Thank you for registering. Please use the verification code below to activate your account:",
                otp,
                "This code will expire in 10 minutes. If you did not request this email, please ignore it."
        );
        return sendEmail(toEmail, subject, htmlContent, otp);
    }

    public boolean sendPasswordResetOtpEmail(String toEmail, String otp) {
        String subject = "Reset your Serenity AI password";
        String htmlContent = buildEmailTemplate(
                "Password Reset Request 🔐",
                "We received a request to reset the password for your Serenity AI account. Use the verification code below to set a new password:",
                otp,
                "This code is valid for single-use and expires in 10 minutes. If you did not request a password reset, please secure your account immediately."
        );
        return sendEmail(toEmail, subject, htmlContent, otp);
    }

    public boolean sendEmergencyAlertEmail(String toEmail, String contactName, String userName) {
        String displayName = (userName != null && !userName.isBlank()) ? userName : "Your loved one";
        String recipient = (contactName != null && !contactName.isBlank()) ? contactName : "Trusted Contact";
        String subject = "Serenity AI — Emergency Support Request from " + displayName;
        String messageBody = "Hi " + recipient + ",\n\n" +
                "This is an emergency support notification from " + displayName + " via Serenity AI.\n\n" +
                displayName + " is currently experiencing a difficult moment and requested an urgent check-in from their Trusted Circle.\n\n" +
                "Please reach out to them as soon as possible.";
        String htmlContent = buildEmailTemplate(
                "Emergency Support Alert 🆘",
                messageBody,
                "URGENT CHECK-IN",
                "This message was requested directly by " + displayName + " through Serenity AI."
        );
        return sendEmail(toEmail, subject, htmlContent, "CHECK-IN");
    }

    private boolean sendEmail(String toEmail, String subject, String htmlContent, String otp) {
        if (mailSender == null) {
            logger.warn("MailSender is not configured. Unable to send email to {}", toEmail);
            throw new IllegalStateException("Email service is not configured on the server.");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
            
            String senderAddress = (fromEmail != null && !fromEmail.isBlank() && !fromEmail.contains("noreply@serenity.ai"))
                    ? fromEmail.trim()
                    : "teamserenityai@gmail.com";

            helper.setFrom(senderAddress);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Email sent successfully to {}", toEmail);
            return true;
        } catch (Exception e) {
            logger.error("==================================================");
            logger.error("❌ BACKEND SMTP DELIVERY EXCEPTION:");
            logger.error("   Exception Class: {}", e.getClass().getName());
            logger.error("   Message: {}", e.getMessage());
            Throwable cause = e.getCause();
            while (cause != null) {
                logger.error("   Caused By: {} - {}", cause.getClass().getName(), cause.getMessage());
                cause = cause.getCause();
            }
            logger.error("==================================================", e);

            if (e.getMessage() != null && e.getMessage().contains("Authentication failed")) {
                throw new RuntimeException("Authentication failed");
            }
            throw new RuntimeException("Failed to send verification email: " + e.getMessage());
        }
    }

    private String buildEmailTemplate(String header, String messageBody, String otp, String footerNotice) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head><meta charset='utf-8'></head>" +
                "<body style='font-family: Arial, sans-serif; background-color: #fafaf7; margin: 0; padding: 20px; color: #2d3748;'>" +
                "  <div style='max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 30px; border: 1px solid #e2e8f0; shadow: 0 4px 6px rgba(0,0,0,0.05);'>" +
                "    <div style='text-align: center; margin-bottom: 24px;'>" +
                "      <div style='display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6, #a855f7); border-radius: 14px; line-height: 48px; color: #ffffff; font-size: 24px;'>🌿</div>" +
                "      <h2 style='color: #1e293b; margin-top: 12px; font-size: 22px; font-weight: 700;'>" + header + "</h2>" +
                "    </div>" +
                "    <p style='font-size: 14px; color: #475569; line-height: 1.6; text-align: center;'>" + messageBody + "</p>" +
                "    <div style='background: #f5f0ff; border: 2px dashed #8b5cf6; border-radius: 16px; padding: 18px; text-align: center; margin: 24px 0;'>" +
                "      <span style='font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #7c3aed; display: block;'>" + otp + "</span>" +
                "    </div>" +
                "    <p style='font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;'>" + footerNotice + "</p>" +
                "    <hr style='border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;' />" +
                "    <p style='font-size: 11px; color: #94a3b8; text-align: center;'>Serenity AI — Your Daily Mental Wellness Sanctuary</p>" +
                "  </div>" +
                "</body>" +
                "</html>";
    }
}
