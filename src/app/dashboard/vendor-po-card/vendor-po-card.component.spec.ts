import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorPoCardComponent } from './vendor-po-card.component';

describe('VendorPoCardComponent', () => {
  let component: VendorPoCardComponent;
  let fixture: ComponentFixture<VendorPoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VendorPoCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendorPoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
