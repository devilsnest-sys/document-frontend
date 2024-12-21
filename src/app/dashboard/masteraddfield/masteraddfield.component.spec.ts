import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasteraddfieldComponent } from './masteraddfield.component';

describe('MasteraddfieldComponent', () => {
  let component: MasteraddfieldComponent;
  let fixture: ComponentFixture<MasteraddfieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MasteraddfieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasteraddfieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
