import { TestBed } from '@angular/core/testing';

import { ApiKeys } from './api-keys';

describe('ApiKeys', () => {
  let service: ApiKeys;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiKeys);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
