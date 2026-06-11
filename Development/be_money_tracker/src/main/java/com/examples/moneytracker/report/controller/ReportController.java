package com.examples.moneytracker.report.controller;

import com.examples.moneytracker.auth.security.CustomUserDetails;
import com.examples.moneytracker.common.dto.ApiResponse;
import com.examples.moneytracker.report.dto.*;
import com.examples.moneytracker.report.service.ReportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ObjectMapper objectMapper;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ReportSummaryResponse>> summary(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        return ResponseEntity.ok(ApiResponse.of(reportService.summary(user.getId(), fromDate, toDate)));
    }

    @GetMapping("/by-wallet")
    public ResponseEntity<ApiResponse<ReportByWalletResponse>> byWallet(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        return ResponseEntity.ok(ApiResponse.of(reportService.byWallet(user.getId(), fromDate, toDate)));
    }

    @GetMapping("/by-time")
    public ResponseEntity<ApiResponse<ReportByTimeResponse>> byTime(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam String groupBy
    ) {
        return ResponseEntity.ok(ApiResponse.of(reportService.byTime(user.getId(), fromDate, toDate, groupBy)));
    }

    @GetMapping("/budget-health")
    public ResponseEntity<ApiResponse<ReportBudgetHealthResponse>> budgetHealth(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(reportService.budgetHealth(user.getId())));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<ReportInsightsResponse>> insights(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(ApiResponse.of(reportService.insights()));
    }

    @PostMapping("/export")
    public ResponseEntity<String> export(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate
    ) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("summary", reportService.summary(user.getId(), fromDate, toDate));

        String json = objectMapper.writeValueAsString(payload);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDisposition(ContentDisposition.attachment().filename("report.json").build());

        return ResponseEntity.ok()
                .headers(headers)
                .body(json);
    }
}
