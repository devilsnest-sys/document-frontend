import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllStagesDocumentsComponent } from './all-stages-documents.component';

describe('AllStagesDocumentsComponent', () => {
  let component: AllStagesDocumentsComponent;
  let fixture: ComponentFixture<AllStagesDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AllStagesDocumentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllStagesDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
