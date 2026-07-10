package com.saha.setup;

import java.util.List;

/**
 * Pilot readiness snapshot for a tenant: the overall {@code status} plus the
 * auto-checked {@code checklist} that drives it.
 */
public record ReadinessDto(String status, List<ReadinessChecklistItem> checklist) {
}
