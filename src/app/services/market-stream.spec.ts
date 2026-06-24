import { TestBed } from '@angular/core/testing';

import { MarketStream } from './market-stream';

describe('MarketStream', () => {
  let service: MarketStream;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarketStream);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
