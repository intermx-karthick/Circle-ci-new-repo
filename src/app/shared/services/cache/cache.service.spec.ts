import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CacheService } from '@shared/services/cache/cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        CacheService
      ]
    }).compileComponents();
    cache = TestBed.inject(CacheService);
  });

  it('should be created', () => {
    expect(cache).toBeTruthy();
  });

  it('should cache the data', () => {
    cache.setAndGet('key', of(true));
    expect(cache.get('key')).toBeDefined();
  });

  it('should cached data expired', () => {
    cache.setAndGet('key?page=1',
      of(true),
      null,
      { isTimerRequired: true, ttl: 500 });

    expect(cache.get('key?page=1')).toBeDefined();
    setTimeout(_ => {
      expect(cache.get('key?page=1')).toBeUndefined();
    }, 1000);
  });

  it('should delete cached data', () => {
    cache.setAndGet('key', of(true));
    expect(cache.get('key')).toBeDefined();
    expect(cache.delete('key'));
    expect(cache.get('key')).toBeUndefined();
  });

  it('should delete cached data by regx', () => {
    cache.setAndGet('key?page=1', of(true));
    expect(cache.get('key?page=1')).toBeDefined();
    expect(cache.delete('key', true));
    expect(cache.get('key?page=1')).toBeUndefined();
  });
});
