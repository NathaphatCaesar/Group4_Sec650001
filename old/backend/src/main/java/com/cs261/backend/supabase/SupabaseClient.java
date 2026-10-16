package com.cs261.backend.supabase;

import com.cs261.backend.common.ApiException;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class SupabaseClient {

    private static final Logger log = LoggerFactory.getLogger(SupabaseClient.class);
    private static final ParameterizedTypeReference<List<Map<String, Object>>> ROWS =
            new ParameterizedTypeReference<>() { };

    private final RestClient client;

    public SupabaseClient(
            @Value("${supabase.url}") String url,
            @Value("${supabase.service-key}") String serviceKey) {
        HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(10));

        this.client = RestClient.builder()
                .baseUrl(url.replaceAll("/+$", "") + "/rest/v1")
                .requestFactory(factory)
                .defaultHeader("apikey", serviceKey)
                .defaultHeader("Authorization", "Bearer " + serviceKey)
                .build();
    }

    public List<Map<String, Object>> select(String uri, Object... vars) {
        try {
            List<Map<String, Object>> rows = client.get().uri(uri, vars).retrieve().body(ROWS);
            return rows == null ? List.of() : rows;
        } catch (RestClientException e) {
            throw fail("select", e);
        }
    }

    public Map<String, Object> selectOne(String uri, Object... vars) {
        List<Map<String, Object>> rows = select(uri, vars);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public Map<String, Object> insert(String table, Map<String, Object> row) {
        try {
            List<Map<String, Object>> rows = client.post()
                    .uri("/" + table)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Prefer", "return=representation")
                    .body(row)
                    .retrieve()
                    .body(ROWS);
            return rows == null || rows.isEmpty() ? null : rows.get(0);
        } catch (RestClientException e) {
            throw fail("insert " + table, e);
        }
    }

    public Map<String, Object> update(String uri, Map<String, Object> changes, Object... vars) {
        try {
            List<Map<String, Object>> rows = client.patch()
                    .uri(uri, vars)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Prefer", "return=representation")
                    .body(changes)
                    .retrieve()
                    .body(ROWS);
            return rows == null || rows.isEmpty() ? null : rows.get(0);
        } catch (RestClientException e) {
            throw fail("update", e);
        }
    }

    public void delete(String uri, Object... vars) {
        try {
            client.delete().uri(uri, vars).retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            throw fail("delete", e);
        }
    }

    private ApiException fail(String action, RestClientException e) {
        log.error("Supabase {} failed: {}", action, e.getMessage());
        return new ApiException(HttpStatus.BAD_GATEWAY, "ฐานข้อมูลมีปัญหา ลองใหม่อีกครั้ง");
    }
}
