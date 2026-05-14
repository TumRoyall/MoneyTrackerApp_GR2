package com.examples.moneytracker.config;

import com.examples.moneytracker.garden.config.GardenFeatureInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class GardenFeatureWebConfig implements WebMvcConfigurer {

    private final GardenFeatureInterceptor featureInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(featureInterceptor)
                .addPathPatterns("/api/garden/**");
    }
}
