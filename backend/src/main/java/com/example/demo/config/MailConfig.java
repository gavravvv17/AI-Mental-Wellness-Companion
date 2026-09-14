package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    private static final Logger logger = LoggerFactory.getLogger(MailConfig.class);

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username:teamserenityai@gmail.com}")
    private String username;

    @Value("${spring.mail.password:sotfvslattrczdpo}")
    private String password;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        
        String cleanUsername = username != null ? username.trim() : "";
        String cleanPassword = password != null ? password.replaceAll("\\s+", "").trim() : "";

        mailSender.setUsername(cleanUsername);
        mailSender.setPassword(cleanPassword);

        logger.info("==================================================");
        logger.info("📧 Mail Service Configuration Initialized:");
        logger.info("   SMTP Host: {}", host);
        logger.info("   SMTP Port: {}", port);
        logger.info("   MAIL_USERNAME set: {}", !cleanUsername.isBlank());
        logger.info("   MAIL_USERNAME value: {}", cleanUsername);
        logger.info("   MAIL_PASSWORD set: {}", !cleanPassword.isBlank());
        logger.info("   MAIL_PASSWORD length: {}", cleanPassword.length());
        logger.info("==================================================");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        return mailSender;
    }
}
