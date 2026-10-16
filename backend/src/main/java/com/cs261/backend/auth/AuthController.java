package com.cs261.backend.auth;

import com.cs261.backend.common.ApiException;
import com.cs261.backend.tu.TuApiClient;
import com.cs261.backend.tu.TuProfile;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    static final String COOKIE = "bh_session";

    private final TuApiClient tu;
    private final ProfileService profiles;
    private final SessionService sessions;
    private final LoginRateLimiter limiter;
    private final boolean secureCookie;

    public AuthController(
            TuApiClient tu,
            ProfileService profiles,
            SessionService sessions,
            LoginRateLimiter limiter,
            @Value("${session.cookie-secure:false}") boolean secureCookie) {
        this.tu = tu;
        this.profiles = profiles;
        this.sessions = sessions;
        this.limiter = limiter;
        this.secureCookie = secureCookie;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest body, HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        limiter.check("login:" + ip);

        String username = body == null || body.username() == null ? "" : body.username().trim();
        String password = body == null || body.password() == null ? "" : body.password();
        if (username.isEmpty() || password.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "กรอกบัญชี มธ. และรหัสผ่านให้ครบ");
        }
        if (username.length() > 64 || password.length() > 256) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "บัญชี มธ. หรือรหัสผ่านยาวเกินไป");
        }

        TuProfile verified = tu.verify(username, password);
        Map<String, Object> profile = profiles.syncFromTu(verified, username);
        String token = sessions.create(profile.get("id").toString(), request.getHeader("User-Agent"), ip);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie(token, sessions.maxAge()).toString())
                .body(Map.of("ok", true, "user", UserDto.from(profile)));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@CookieValue(name = COOKIE, required = false) String token) {
        String userId = sessions.findUserId(token);
        Map<String, Object> profile = userId == null ? null : profiles.findById(userId);
        if (profile == null || Boolean.TRUE.equals(profile.get("is_suspended"))) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "ยังไม่ได้เข้าสู่ระบบ");
        }
        return ResponseEntity.ok(Map.of("ok", true, "user", UserDto.from(profile)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@CookieValue(name = COOKIE, required = false) String token) {
        sessions.delete(token);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString())
                .body(Map.of("ok", true));
    }

    private ResponseCookie cookie(String value, Duration maxAge) {
        return ResponseCookie.from(COOKIE, value)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}
