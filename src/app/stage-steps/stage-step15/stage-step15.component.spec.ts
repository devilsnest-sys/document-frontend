import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep15Component } from './stage-step15.component';

describe('StageStep15Component', () => {
  let component: StageStep15Component;
  let fixture: ComponentFixture<StageStep15Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep15Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep15Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
