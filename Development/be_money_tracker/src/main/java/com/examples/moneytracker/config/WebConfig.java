package com.examples.moneytracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig {

    /**
     * Comma-separated list of allowed CORS origins.
     * Override with env var: CORS_ALLOWED_ORIGINS=https://admin.example.com,https://web.example.com
     * The literal "null" string also accepts native mobile apps that don't send an Origin header.
     */
    @Value("${cors.allowed-origins:http://localhost:8081,http://localhost:19006,null}")
    private String allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                List<String> origins = Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();

                // `allowedOriginPatterns` accepts "null" as a literal pattern, which is what
                // native mobile clients (React Native, Expo) send when they have no Origin header.
                registry.addMapping("/**")
                        .allowedOriginPatterns(origins.toArray(new String[0]))
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}
