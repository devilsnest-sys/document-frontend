import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep2Component } from './stage-step2.component';

describe('StageStep2Component', () => {
  let component: StageStep2Component;
  let fixture: ComponentFixture<StageStep2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
