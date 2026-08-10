package com.saha.event;

import jakarta.validation.constraints.NotBlank;

/** Body for updating an event's preparation status from the Events Team side. */
public record PreparationStatusUpdateRequest(
        @NotBlank String preparationStatus,
        String opsNotes
) {
}