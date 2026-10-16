package com.cs261.backend.tu;

public record TuProfile(
        String type,
        String username,
        String displayNameTh,
        String displayNameEn,
        String email,
        String department,
        String faculty,
        String organization,
        String tuStatus
) {
}
