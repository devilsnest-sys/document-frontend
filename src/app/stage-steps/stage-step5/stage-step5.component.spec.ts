import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep5Component } from './stage-step5.component';

describe('StageStep5Component', () => {
  let component: StageStep5Component;
  let fixture: ComponentFixture<StageStep5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep5Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
