import { Component, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html'
})
export class StatusBadge {
  readonly status = input.required<string>();
  readonly label = input<string>('');

  get displayLabel(): string {
    return this.label() || this.status();
  }

  get badgeClasses(): string {
    switch (this.status().toLowerCase()) {
      case 'active':
        return 'bg-[#dff0e8] text-[#1f5c41]';
      case 'inactive':
        return 'bg-[#f1f0ef] text-[#55514a]';
      case 'invited':
        return 'bg-[#ece6f1] text-[#46294f]';
      case 'setup-pending':
      case 'not-saved':
      case 'warning':
        return 'bg-[#f7e7d6] text-[#b06d1a]';
      case 'limited-data':
      case 'error':
        return 'bg-red-50 text-red-700 border border-red-300';
      default:
        return 'bg-[#f1f0ef] text-[#55514a]';
    }
  }
}
