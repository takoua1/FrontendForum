import { TestBed } from '@angular/core/testing';

import { SignaleService } from './signale.service';

describe('SignaleService', () => {
  let service: SignaleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignaleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
