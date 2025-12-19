import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherDocUploadComponent } from './other-doc-upload.component';

describe('OtherDocUploadComponent', () => {
  let component: OtherDocUploadComponent;
  let fixture: ComponentFixture<OtherDocUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OtherDocUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtherDocUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
