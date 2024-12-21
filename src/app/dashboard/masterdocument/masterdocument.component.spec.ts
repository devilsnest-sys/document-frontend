import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterdocumentComponent } from './masterdocument.component';

describe('MasterdocumentComponent', () => {
  let component: MasterdocumentComponent;
  let fixture: ComponentFixture<MasterdocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MasterdocumentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterdocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
