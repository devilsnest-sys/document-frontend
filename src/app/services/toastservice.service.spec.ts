import { TestBed } from '@angular/core/testing';

import { ToastserviceService } from './toastservice.service';

describe('ToastserviceService', () => {
  let service: ToastserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
