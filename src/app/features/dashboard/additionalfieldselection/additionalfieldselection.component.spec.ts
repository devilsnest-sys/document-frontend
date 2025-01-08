import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalfieldselectionComponent } from './additionalfieldselection.component';

describe('AdditionalfieldselectionComponent', () => {
  let component: AdditionalfieldselectionComponent;
  let fixture: ComponentFixture<AdditionalfieldselectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdditionalfieldselectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdditionalfieldselectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
