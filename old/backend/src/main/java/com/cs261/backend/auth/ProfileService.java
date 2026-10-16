package com.cs261.backend.auth;

import com.cs261.backend.common.ApiException;
import com.cs261.backend.supabase.SupabaseClient;
import com.cs261.backend.tu.TuProfile;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {

    private static final List<String> ACADEMIC_PREFIXES = List.of("คณะ", "วิทยาลัย", "สถาบัน");

    private final SupabaseClient db;

    public ProfileService(SupabaseClient db) {
        this.db = db;
    }

    public Map<String, Object> findById(String id) {
        return db.selectOne("/profiles?id=eq.{id}&select=*", id);
    }

    public Map<String, Object> syncFromTu(TuProfile tu, String typedUsername) {
        String tuUsername = (tu.username().isBlank() ? typedUsername : tu.username()).toLowerCase();
        Map<String, Object> existing = db.selectOne("/profiles?tu_username=eq.{u}&select=*", tuUsername);

        if (existing != null && Boolean.TRUE.equals(existing.get("is_suspended"))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "บัญชีนี้ถูกระงับการใช้งาน ติดต่อผู้ดูแลระบบ");
        }

        String studentId = tuUsername.matches("\\d{10}") ? tuUsername : null;
        String facultyName = !tu.faculty().isBlank() ? tu.faculty() : tu.organization();

        Map<String, Object> fields = new HashMap<>();
        fields.put("display_name_th", blankToNull(tu.displayNameTh()));
        fields.put("display_name_en", blankToNull(tu.displayNameEn()));
        fields.put("email", blankToNull(tu.email().toLowerCase()));
        fields.put("role", inferRole(tu, facultyName));
        fields.put("faculty_name", blankToNull(facultyName));
        fields.put("faculty_id", matchFaculty(facultyName));
        fields.put("department", blankToNull(tu.department()));
        fields.put("tu_status", blankToNull(tu.tuStatus()));
        fields.put("is_verified", true);
        fields.put("last_login_at", Instant.now().toString());
        if (studentId != null) {
            fields.put("student_id", studentId);
            fields.put("entry_year_be", 2500 + Integer.parseInt(studentId.substring(0, 2)));
        }

        if (existing != null) {
            Map<String, Object> updated = db.update("/profiles?id=eq.{id}", fields, existing.get("id"));
            return updated != null ? updated : existing;
        }

        fields.put("id", UUID.randomUUID().toString());
        fields.put("tu_username", tuUsername);
        fields.put("username", uniqueUsername(tuUsername));
        fields.put("display_name", displayName(tu, tuUsername));
        fields.put("onboarded_at", Instant.now().toString());

        Map<String, Object> created = db.insert("profiles", fields);
        if (created == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "สร้างบัญชีไม่สำเร็จ ลองใหม่อีกครั้ง");
        }
        return created;
    }

    private String inferRole(TuProfile tu, String facultyName) {
        if ("student".equalsIgnoreCase(tu.type())) {
            return "student";
        }
        String org = facultyName == null ? "" : facultyName;
        return ACADEMIC_PREFIXES.stream().anyMatch(org::startsWith) ? "instructor" : "staff";
    }

    private String matchFaculty(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        Map<String, Object> exact = db.selectOne("/faculties?name_th=eq.{n}&select=id", name);
        if (exact != null) {
            return exact.get("id").toString();
        }
        String stripped = name.replaceFirst("^(คณะ|วิทยาลัย)", "").trim();
        if (stripped.isEmpty()) {
            return null;
        }
        Map<String, Object> like = db.selectOne("/faculties?name_th=ilike.*{n}*&select=id&limit=1", stripped);
        return like == null ? null : like.get("id").toString();
    }

    private String uniqueUsername(String tuUsername) {
        String base = tuUsername.replaceAll("[^a-z0-9._]", "");
        if (base.isEmpty()) {
            base = "user";
        }
        String candidate = base;
        for (int i = 2; i < 22; i++) {
            if (db.selectOne("/profiles?username=eq.{u}&select=id", candidate) == null) {
                return candidate;
            }
            candidate = base + i;
        }
        return base + "." + UUID.randomUUID().toString().substring(0, 4);
    }

    private static String displayName(TuProfile tu, String fallback) {
        String name = !tu.displayNameTh().isBlank() ? tu.displayNameTh()
                : !tu.displayNameEn().isBlank() ? tu.displayNameEn()
                : fallback;
        return name.length() > 40 ? name.substring(0, 40) : name;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
