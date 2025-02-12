import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalFieldFlowComponent } from './additional-field-flow.component';

describe('AdditionalFieldFlowComponent', () => {
  let component: AdditionalFieldFlowComponent;
  let fixture: ComponentFixture<AdditionalFieldFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdditionalFieldFlowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdditionalFieldFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
