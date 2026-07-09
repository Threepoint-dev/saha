export interface SourceChannel {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean | null;
  sortOrder: number | null;
  createdAt: string | null;
}

export interface SourceChannelUpsertRequest {
  name: string;
  isActive: boolean | null;
  sortOrder: number | null;
}
