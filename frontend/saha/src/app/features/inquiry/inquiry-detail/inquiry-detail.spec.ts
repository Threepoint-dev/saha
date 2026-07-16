import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InquiryDetail } from './inquiry-detail';

describe('InquiryDetail', () => {
  let component: InquiryDetail;
  let fixture: ComponentFixture<InquiryDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InquiryDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(InquiryDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
