import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep8Component } from './stage-step8.component';

describe('StageStep8Component', () => {
  let component: StageStep8Component;
  let fixture: ComponentFixture<StageStep8Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep8Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep8Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
