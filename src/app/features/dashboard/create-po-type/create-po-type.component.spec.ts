import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePoTypeComponent } from './create-po-type.component';

describe('CreatePoTypeComponent', () => {
  let component: CreatePoTypeComponent;
  let fixture: ComponentFixture<CreatePoTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreatePoTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePoTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
