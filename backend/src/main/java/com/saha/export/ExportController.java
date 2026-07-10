package com.saha.export;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

/**
 * CSV export endpoints (EP-10). Each endpoint streams a UTF-8 (BOM-prefixed) CSV
 * attachment of existing tenant data. Read-only — no schema or data is mutated.
 */
@RestController
@RequestMapping("/api/tenants/{tenantId}/export")
public class ExportController {

    private final ExportService service;

    public ExportController(ExportService service) {
        this.service = service;
    }

    @GetMapping("/inquiries")
    public ResponseEntity<byte[]> inquiries(@PathVariable UUID tenantId) {
        return csv("inquiries", service.exportInquiries(tenantId));
    }

    @GetMapping("/quotes")
    public ResponseEntity<byte[]> quotes(@PathVariable UUID tenantId) {
        return csv("quotes", service.exportQuotes(tenantId));
    }

    @GetMapping("/halls")
    public ResponseEntity<byte[]> halls(@PathVariable UUID tenantId) {
        return csv("halls", service.exportHalls(tenantId));
    }

    @GetMapping("/packages")
    public ResponseEntity<byte[]> packages(@PathVariable UUID tenantId) {
        return csv("packages", service.exportPackages(tenantId));
    }

    @GetMapping("/addons")
    public ResponseEntity<byte[]> addons(@PathVariable UUID tenantId) {
        return csv("addons", service.exportAddons(tenantId));
    }

    private ResponseEntity<byte[]> csv(String type, byte[] body) {
        String filename = "saha-" + type + "-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(body);
    }
}
