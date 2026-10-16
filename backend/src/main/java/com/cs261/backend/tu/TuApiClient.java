package com.cs261.backend.tu;

import com.cs261.backend.common.ApiException;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class TuApiClient {

    private static final Logger log = LoggerFactory.getLogger(TuApiClient.class);
    private static final Pattern KEY_ERROR = Pattern.compile("application[- ]?key", Pattern.CASE_INSENSITIVE);

    private final RestClient client;
    private final String verifyPath;

    public TuApiClient(
            @Value("${tu.api.base}") String base,
            @Value("${tu.api.key}") String key,
            @Value("${tu.path.verify}") String verifyPath) {
        HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(10));

        this.client = RestClient.builder()
                .baseUrl(base.replaceAll("/+$", ""))
                .requestFactory(factory)
                .defaultHeader("Application-Key", key)
                .build();
        this.verifyPath = verifyPath;
    }

    public TuProfile verify(String username, String password) {
        ResponseEntity<Map<String, Object>> response;
        try {
            response = client.post()
                    .uri(verifyPath)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("UserName", username, "PassWord", password))
                    .retrieve()
                    .onStatus(status -> true, (request, res) -> { })
                    .toEntity(new ParameterizedTypeReference<Map<String, Object>>() { });
        } catch (ResourceAccessException e) {
            log.warn("TU API timeout or unreachable: {}", e.getMessage());
            throw new ApiException(HttpStatus.GATEWAY_TIMEOUT, "TU API ไม่ตอบสนอง ลองใหม่อีกครั้ง");
        } catch (RestClientException e) {
            log.warn("TU API bad response: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "TU API ตอบกลับผิดรูปแบบ ลองใหม่อีกครั้ง");
        }

        int code = response.getStatusCode().value();
        Map<String, Object> body = response.getBody();
        String message = body == null ? "" : text(body, "message");

        if (code == 401 || code == 403 || KEY_ERROR.matcher(message).find()) {
            log.error("TU API rejected application key (HTTP {}): {}", code, message);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "ระบบเชื่อมต่อ TU API ไม่ได้ แจ้งผู้ดูแลระบบ");
        }
        if (body == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "TU API ตอบกลับผิดรูปแบบ ลองใหม่อีกครั้ง");
        }
        if (!Boolean.TRUE.equals(body.get("status"))) {
            if (code >= 500) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "TU API มีปัญหา ลองใหม่อีกครั้ง");
            }
            throw new ApiException(HttpStatus.UNAUTHORIZED, "บัญชี มธ. หรือรหัสผ่านไม่ถูกต้อง");
        }

        return new TuProfile(
                text(body, "type"),
                text(body, "username"),
                text(body, "displayname_th"),
                text(body, "displayname_en"),
                text(body, "email"),
                text(body, "department"),
                text(body, "faculty"),
                text(body, "organization"),
                text(body, "tu_status")
        );
    }

    private static String text(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? "" : value.toString().replaceAll("\\s+", " ").trim();
    }
}
