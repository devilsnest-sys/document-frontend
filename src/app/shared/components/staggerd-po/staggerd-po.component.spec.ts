import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaggerdPoComponent } from './staggerd-po.component';

describe('StaggerdPoComponent', () => {
  let component: StaggerdPoComponent;
  let fixture: ComponentFixture<StaggerdPoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StaggerdPoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaggerdPoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
