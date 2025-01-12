import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep1Component } from './stage-step1.component';

describe('StageStep1Component', () => {
  let component: StageStep1Component;
  let fixture: ComponentFixture<StageStep1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
