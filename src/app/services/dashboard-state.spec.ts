import { TestBed } from '@angular/core/testing';

import { DashboardState } from './dashboard-state';

describe('DashboardState', () => {
  let service: DashboardState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
