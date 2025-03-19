import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep10Component } from './stage-step10.component';

describe('StageStep10Component', () => {
  let component: StageStep10Component;
  let fixture: ComponentFixture<StageStep10Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep10Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep10Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
