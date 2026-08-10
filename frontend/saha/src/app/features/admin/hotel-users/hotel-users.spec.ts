import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelUsers } from './hotel-users';

describe('HotelUsers', () => {
  let component: HotelUsers;
  let fixture: ComponentFixture<HotelUsers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelUsers],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelUsers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
