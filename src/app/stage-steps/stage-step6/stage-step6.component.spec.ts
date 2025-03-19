import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep6Component } from './stage-step6.component';

describe('StageStep6Component', () => {
  let component: StageStep6Component;
  let fixture: ComponentFixture<StageStep6Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep6Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep6Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
