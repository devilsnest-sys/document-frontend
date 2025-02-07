import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep4Component } from './stage-step4.component';

describe('StageStep4Component', () => {
  let component: StageStep4Component;
  let fixture: ComponentFixture<StageStep4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep4Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
