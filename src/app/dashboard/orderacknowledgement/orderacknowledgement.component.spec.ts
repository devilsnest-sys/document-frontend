import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderacknowledgementComponent } from './orderacknowledgement.component';

describe('OrderacknowledgementComponent', () => {
  let component: OrderacknowledgementComponent;
  let fixture: ComponentFixture<OrderacknowledgementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderacknowledgementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderacknowledgementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
