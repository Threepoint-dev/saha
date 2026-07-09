export interface Hall {
  id: string;
  tenantId: string;
  name: string;
  capacity: number | null;
  basePrice: number | null;
  defaultSetup: string | null;
  shortCode: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface HallUpsertRequest {
  name: string;
  capacity: number | null;
  basePrice: number | null;
  defaultSetup: string | null;
  shortCode: string | null;
}

export interface EventPackage {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  price: number | null;
  isTaxable: boolean | null;
  status: string;
  createdAt: string | null;
}

export interface PackageUpsertRequest {
  name: string;
  description: string | null;
  price: number | null;
  isTaxable: boolean | null;
}

export interface Addon {
  id: string;
  tenantId: string;
  name: string;
  price: number | null;
  isTaxable: boolean | null;
  status: string;
  createdAt: string | null;
}

export interface AddonUpsertRequest {
  name: string;
  price: number | null;
  isTaxable: boolean | null;
}

export type TabKey = 'halls' | 'packages' | 'addons';
