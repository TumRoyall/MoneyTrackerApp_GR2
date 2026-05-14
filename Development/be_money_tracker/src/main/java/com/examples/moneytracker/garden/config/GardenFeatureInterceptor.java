package com.examples.moneytracker.garden.config;

import com.examples.moneytracker.garden.service.GardenFeatureGuard;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class GardenFeatureInterceptor implements HandlerInterceptor {

    private final GardenFeatureGuard featureGuard;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        featureGuard.assertEnabled();
        return true;
    }
}
