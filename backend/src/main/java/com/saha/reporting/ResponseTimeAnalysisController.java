package com.saha.reporting;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

/** Response Time Analysis (EP-09 / F-30). */
@RestController
@RequestMapping("/api/tenants/{tenantId}/reports/response-time")
public class ResponseTimeAnalysisController {

    private final ResponseTimeAnalysisService service;

    public ResponseTimeAnalysisController(ResponseTimeAnalysisService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseTimeAnalysisDto get(
            @PathVariable UUID tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.analyze(tenantId, from, to);
    }
}