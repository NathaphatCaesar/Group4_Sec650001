package com.cs261.backend.auth;

import com.cs261.backend.supabase.SupabaseClient;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SessionService {

    private final SecureRandom random = new SecureRandom();
    private final SupabaseClient db;
    private final Duration maxAge;

    public SessionService(SupabaseClient db, @Value("${session.max-age-days}") int maxAgeDays) {
        this.db = db;
        this.maxAge = Duration.ofDays(maxAgeDays);
    }

    public Duration maxAge() {
        return maxAge;
    }

    public String create(String userId, String userAgent, String ip) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = HexFormat.of().formatHex(bytes);

        Map<String, Object> row = new HashMap<>();
        row.put("user_id", userId);
        row.put("token_hash", hash(token));
        row.put("user_agent", userAgent == null ? null : userAgent.substring(0, Math.min(300, userAgent.length())));
        row.put("ip", ip);
        row.put("expires_at", Instant.now().plus(maxAge).toString());
        db.insert("sessions", row);

        return token;
    }

    public String findUserId(String token) {
        if (token == null || !token.matches("[0-9a-f]{64}")) {
            return null;
        }
        Map<String, Object> row = db.selectOne(
                "/sessions?token_hash=eq.{h}&expires_at=gt.{now}&select=user_id",
                hash(token), Instant.now().toString());
        return row == null ? null : row.get("user_id").toString();
    }

    public void delete(String token) {
        if (token == null || !token.matches("[0-9a-f]{64}")) {
            return;
        }
        db.delete("/sessions?token_hash=eq.{h}", hash(token));
    }

    private static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
