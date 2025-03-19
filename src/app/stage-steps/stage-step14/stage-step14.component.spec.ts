import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep14Component } from './stage-step14.component';

describe('StageStep14Component', () => {
  let component: StageStep14Component;
  let fixture: ComponentFixture<StageStep14Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep14Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep14Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
