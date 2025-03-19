import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep13Component } from './stage-step13.component';

describe('StageStep13Component', () => {
  let component: StageStep13Component;
  let fixture: ComponentFixture<StageStep13Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep13Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep13Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
