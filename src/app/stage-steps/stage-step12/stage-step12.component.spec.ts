import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep12Component } from './stage-step12.component';

describe('StageStep12Component', () => {
  let component: StageStep12Component;
  let fixture: ComponentFixture<StageStep12Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep12Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep12Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
