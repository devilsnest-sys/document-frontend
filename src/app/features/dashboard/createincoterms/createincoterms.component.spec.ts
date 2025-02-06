import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateincotermsComponent } from './createincoterms.component';

describe('CreateincotermsComponent', () => {
  let component: CreateincotermsComponent;
  let fixture: ComponentFixture<CreateincotermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateincotermsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateincotermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
