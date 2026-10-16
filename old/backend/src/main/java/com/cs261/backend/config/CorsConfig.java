package com.cs261.backend.config;

import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String frontendUrl;

    public CorsConfig(@Value("${frontend.url}") String frontendUrl) {
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        Set<String> origins = new LinkedHashSet<>();
        origins.add(frontendUrl);
        origins.add(frontendUrl.replace("://127.0.0.1", "://localhost"));
        origins.add(frontendUrl.replace("://localhost", "://127.0.0.1"));

        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Content-Type")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
