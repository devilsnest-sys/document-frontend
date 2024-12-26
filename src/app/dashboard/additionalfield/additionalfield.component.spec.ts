import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalfieldComponent } from './additionalfield.component';

describe('AdditionalfieldComponent', () => {
  let component: AdditionalfieldComponent;
  let fixture: ComponentFixture<AdditionalfieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdditionalfieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdditionalfieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
