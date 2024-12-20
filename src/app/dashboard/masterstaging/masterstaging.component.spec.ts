import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterstagingComponent } from './masterstaging.component';

describe('MasterstagingComponent', () => {
  let component: MasterstagingComponent;
  let fixture: ComponentFixture<MasterstagingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MasterstagingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterstagingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
