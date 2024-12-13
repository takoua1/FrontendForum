import { TestBed } from '@angular/core/testing';

import { NativeService } from './nativeHttp.service';

describe('NativeService', () => {
  let service: NativeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NativeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
