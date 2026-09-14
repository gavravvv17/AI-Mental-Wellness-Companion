package com.example.demo.dto;

import com.example.demo.model.OtpToken.OtpType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, max = 6)
    private String otp;

    private OtpType type = OtpType.EMAIL_VERIFICATION;
}
