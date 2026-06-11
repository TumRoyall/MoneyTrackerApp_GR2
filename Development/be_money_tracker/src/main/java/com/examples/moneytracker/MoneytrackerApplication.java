package com.examples.moneytracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.filter.CharacterEncodingFilter;

import java.nio.charset.StandardCharsets;

@SpringBootApplication
public class MoneytrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(MoneytrackerApplication.class, args);
    }

    /**
     * Force UTF-8 encoding on every request/response so Vietnamese characters
     * in AI Budget responses are not corrupted on the client.
     */
    @Bean
    public CharacterEncodingFilter characterEncodingFilter() {
        CharacterEncodingFilter filter = new CharacterEncodingFilter();
        filter.setEncoding("UTF-8");
        filter.setForceEncoding(true);
        return filter;
    }

    /**
     * Ensure JSON responses declare charset=utf-8 in their Content-Type header.
     */
    @Bean
    public MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter(com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(objectMapper);
        converter.setDefaultCharset(StandardCharsets.UTF_8);
        converter.setSupportedMediaTypes(java.util.List.of(
                MediaType.APPLICATION_JSON,
                new MediaType("application", "*+json", StandardCharsets.UTF_8)
        ));
        return converter;
    }
}
