import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewInquiry } from './new-inquiry';

describe('NewInquiry', () => {
  let component: NewInquiry;
  let fixture: ComponentFixture<NewInquiry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewInquiry],
    }).compileComponents();

    fixture = TestBed.createComponent(NewInquiry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
