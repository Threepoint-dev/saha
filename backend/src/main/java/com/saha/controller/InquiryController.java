package com.saha.controller;

import com.saha.model.Inquiry;
import com.saha.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @GetMapping
    public ResponseEntity<List<Inquiry>> getAll() {
        return ResponseEntity.ok(inquiryService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inquiry> getById(@PathVariable UUID id) {
        return inquiryService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<Inquiry>> getByTenantId(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(inquiryService.getByTenantId(tenantId));
    }

    @GetMapping("/tenant/{tenantId}/status/{status}")
    public ResponseEntity<List<Inquiry>> getByTenantIdAndStatus(
            @PathVariable UUID tenantId,
            @PathVariable String status) {
        return ResponseEntity.ok(inquiryService.getByTenantIdAndStatus(tenantId, status));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Inquiry>> getByOwnerId(@PathVariable UUID ownerId) {
        return ResponseEntity.ok(inquiryService.getByOwnerId(ownerId));
    }

    @PostMapping
    public ResponseEntity<Inquiry> create(@RequestBody Inquiry inquiry) {
        return ResponseEntity.ok(inquiryService.create(inquiry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Inquiry> update(@PathVariable UUID id,
                                          @RequestBody Inquiry inquiry) {
        return ResponseEntity.ok(inquiryService.update(id, inquiry));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Inquiry> updateStatus(@PathVariable UUID id,
                                                @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        String changedById = body.get("changedById");
        UUID changedByUUID = changedById != null ? UUID.fromString(changedById) : null;
        return ResponseEntity.ok(inquiryService.updateStatus(id, newStatus, changedByUUID));
    }

    @PatchMapping("/{id}/mark-lost")
    public ResponseEntity<Inquiry> markLost(@PathVariable UUID id,
                                            @RequestBody Map<String, String> body) {
        String lossReason = body.get("lossReason");
        String lossNote = body.get("lossNote");
        return ResponseEntity.ok(inquiryService.markLost(id, lossReason, lossNote));
    }

    /** Shares the Final Internal BEO with the Events Team. Only allowed once the inquiry is Won. */
    @PatchMapping("/{id}/share-beo")
    public ResponseEntity<Inquiry> shareBeo(@PathVariable UUID id) {
        return ResponseEntity.ok(inquiryService.shareBeo(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        inquiryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}