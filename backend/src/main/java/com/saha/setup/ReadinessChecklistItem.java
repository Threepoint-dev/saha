package com.saha.setup;

/**
 * A single auto-checked item on the pilot readiness checklist.
 *
 * @param key   stable machine key (e.g. {@code has_halls})
 * @param label human-readable label shown in the UI
 * @param done  whether the underlying setup requirement is satisfied
 */
public record ReadinessChecklistItem(String key, String label, boolean done) {
}
