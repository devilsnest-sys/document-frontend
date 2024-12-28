import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentselectionComponent } from './documentselection.component';

describe('DocumentselectionComponent', () => {
  let component: DocumentselectionComponent;
  let fixture: ComponentFixture<DocumentselectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentselectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentselectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
