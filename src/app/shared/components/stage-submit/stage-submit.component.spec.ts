import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageSubmitComponent } from './stage-submit.component';

describe('StageSubmitComponent', () => {
  let component: StageSubmitComponent;
  let fixture: ComponentFixture<StageSubmitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageSubmitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StageSubmitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
