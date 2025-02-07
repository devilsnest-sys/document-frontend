import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep3Component } from './stage-step3.component';

describe('StageStep3Component', () => {
  let component: StageStep3Component;
  let fixture: ComponentFixture<StageStep3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
