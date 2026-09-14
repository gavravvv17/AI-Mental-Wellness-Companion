package com.example.demo.dto;

import com.example.demo.model.OtpToken.OtpType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResendOtpRequest {
    @NotBlank
    @Email
    private String email;

    private OtpType type = OtpType.EMAIL_VERIFICATION;
}
