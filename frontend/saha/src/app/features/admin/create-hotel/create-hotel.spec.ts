import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateHotel } from './create-hotel';

describe('CreateHotel', () => {
  let component: CreateHotel;
  let fixture: ComponentFixture<CreateHotel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateHotel],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateHotel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
