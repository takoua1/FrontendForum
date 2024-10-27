import { TestBed } from '@angular/core/testing';

import { MessageMailService } from './message-mail.service';

describe('MessageMailService', () => {
  let service: MessageMailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageMailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
