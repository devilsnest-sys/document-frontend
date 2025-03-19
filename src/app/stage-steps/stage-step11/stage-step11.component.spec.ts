import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageStep11Component } from './stage-step11.component';

describe('StageStep11Component', () => {
  let component: StageStep11Component;
  let fixture: ComponentFixture<StageStep11Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageStep11Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageStep11Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
