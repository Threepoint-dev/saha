import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-accordion-section',
  templateUrl: './accordion-section.html'
})
export class AccordionSection {
  readonly sectionNumber = input.required<number>();
  readonly title = input.required<string>();
  readonly summary = input<string>('');
  readonly isFilled = input<boolean>(false);

  readonly isExpanded = signal(false);

  toggle() {
    this.isExpanded.update(v => !v);
  }
}
