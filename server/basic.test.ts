import { describe, it, expect } from 'vitest';

describe('Basic Test Suite', () => {
  it('should verify testing framework is working', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify string operations', () => {
    expect('hello world').toContain('world');
  });

  it('should verify array operations', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should verify object operations', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(42);
  });
});
