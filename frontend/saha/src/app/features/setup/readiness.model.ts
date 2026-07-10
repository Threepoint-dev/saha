export interface ReadinessChecklistItem {
  key: string;
  label: string;
  done: boolean;
}

export interface Readiness {
  status: string;
  checklist: ReadinessChecklistItem[];
}
