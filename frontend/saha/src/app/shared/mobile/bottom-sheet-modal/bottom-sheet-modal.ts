import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-bottom-sheet-modal',
  templateUrl: './bottom-sheet-modal.html'
})
export class BottomSheetModal {
  readonly isOpen = input.required<boolean>();
  readonly title = input<string>('');
  readonly actionLabel = input<string>('Confirm');
  readonly actionDisabled = input<boolean>(false);

  readonly closed = output<void>();
  readonly action = output<void>();

  dismiss() { this.closed.emit(); }
  onAction() { this.action.emit(); }
}
