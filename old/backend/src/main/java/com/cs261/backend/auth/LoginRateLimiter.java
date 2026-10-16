package com.cs261.backend.auth;

import com.cs261.backend.common.ApiException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class LoginRateLimiter {

    private static final int LIMIT = 8;
    private static final long WINDOW_MS = 10 * 60 * 1000L;

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    public void check(String key) {
        long now = System.currentTimeMillis();
        Deque<Long> times = hits.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() > WINDOW_MS) {
                times.pollFirst();
            }
            if (times.size() >= LIMIT) {
                long waitSec = Math.max(1, (WINDOW_MS - (now - times.peekFirst())) / 1000);
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "ลองล็อกอินบ่อยเกินไป รออีก " + waitSec + " วินาทีแล้วลองใหม่");
            }
            times.addLast(now);
        }

        if (hits.size() > 10_000) {
            hits.entrySet().removeIf(e -> e.getValue().isEmpty()
                    || now - e.getValue().peekLast() > WINDOW_MS);
        }
    }
}
