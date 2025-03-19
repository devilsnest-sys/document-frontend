import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep7Component } from './stage-step7.component';

describe('StageStep7Component', () => {
  let component: StageStep7Component;
  let fixture: ComponentFixture<StageStep7Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep7Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
