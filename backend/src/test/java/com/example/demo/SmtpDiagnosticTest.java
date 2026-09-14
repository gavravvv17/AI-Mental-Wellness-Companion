package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import jakarta.mail.Transport;
import java.util.Properties;

public class SmtpDiagnosticTest {

    @Test
    void testGmailSmtpConnection() {
        String username = System.getenv("MAIL_USERNAME");
        if (username == null || username.isBlank()) {
            username = "teamserenityai@gmail.com";
        }
        
        String password = System.getenv("MAIL_PASSWORD");
        if (password == null || password.isBlank()) {
            password = "kuasuugqtrxqgmay";
        }
        
        // Remove any spaces if present in app password
        password = password.replaceAll("\\s+", "");

        System.out.println("==================================================");
        System.out.println("🔍 SMTP DIAGNOSTIC TEST");
        System.out.println("SMTP Host: smtp.gmail.com");
        System.out.println("SMTP Port: 587");
        System.out.println("MAIL_USERNAME configured: " + (username != null && !username.isBlank()));
        System.out.println("MAIL_USERNAME value: " + username);
        System.out.println("MAIL_PASSWORD configured: " + (password != null && !password.isBlank()));
        System.out.println("MAIL_PASSWORD length: " + (password != null ? password.length() : 0));
        System.out.println("==================================================");

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");

        try {
            mailSender.testConnection();
            System.out.println("✅ SMTP CONNECTION SUCCESSFUL!");
        } catch (Exception e) {
            System.out.println("❌ SMTP CONNECTION FAILED!");
            System.out.println("Exception Class: " + e.getClass().getName());
            System.out.println("Exception Message: " + e.getMessage());
            if (e.getCause() != null) {
                System.out.println("Cause Class: " + e.getCause().getClass().getName());
                System.out.println("Cause Message: " + e.getCause().getMessage());
            }
        }
        System.out.println("==================================================");
    }
}
