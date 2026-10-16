package com.cs261.backend.auth;

import java.util.Map;

public record UserDto(
        String id,
        String username,
        String displayName,
        String role,
        String studentId,
        String facultyName,
        Integer entryYearBe,
        String avatarUrl
) {

    public static UserDto from(Map<String, Object> profile) {
        Object override = profile.get("role_override");
        Object year = profile.get("entry_year_be");
        return new UserDto(
                str(profile.get("id")),
                str(profile.get("username")),
                str(profile.get("display_name")),
                str(override != null ? override : profile.get("role")),
                str(profile.get("student_id")),
                str(profile.get("faculty_name")),
                year instanceof Number n ? n.intValue() : null,
                str(profile.get("avatar_url"))
        );
    }

    private static String str(Object value) {
        return value == null ? null : value.toString();
    }
}
