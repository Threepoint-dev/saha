export type BlockStatus = 'tentative' | 'confirmed' | 'blocked' | 'maintenance';

export interface HallAvailabilityBlock {
  id: string;
  tenantId: string;
  hallId: string;
  hallName: string | null;
  inquiryId: string | null;
  createdBy: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  status: BlockStatus | string;
  reason: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface HallAvailabilityUpsertRequest {
  hallId: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  status: BlockStatus | string;
  inquiryId: string | null;
  reason: string | null;
  notes: string | null;
  force: boolean;
}

/** Returned by the API with a 409 status when a block overlaps an existing one. */
export interface HallAvailabilityConflict {
  message: string;
  conflict: HallAvailabilityBlock;
}

export const BLOCK_STATUSES: { value: BlockStatus; label: string }[] = [
  { value: 'tentative', label: 'Tentative Hold' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'maintenance', label: 'Maintenance' }
];