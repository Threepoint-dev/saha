package com.saha.service;

import com.saha.dto.HallAvailabilityDto;

/**
 * Thrown when a new/edited block would overlap an existing block on the same
 * hall and date, and the caller did not explicitly ask to save anyway
 * (see HallAvailabilityUpsertRequest#force). Carries the conflicting block
 * so the UI can show what it collides with.
 */
public class HallAvailabilityConflictException extends RuntimeException {

    private final HallAvailabilityDto conflict;

    public HallAvailabilityConflictException(HallAvailabilityDto conflict) {
        super("Hall is already booked for this date.");
        this.conflict = conflict;
    }

    public HallAvailabilityDto getConflict() {
        return conflict;
    }
}