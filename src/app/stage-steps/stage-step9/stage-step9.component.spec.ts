import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep9Component } from './stage-step9.component';

describe('StageStep9Component', () => {
  let component: StageStep9Component;
  let fixture: ComponentFixture<StageStep9Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep9Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep9Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
