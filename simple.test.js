import { describe, it, expect } from 'vitest';

describe('Simple Test Suite', () => {
  it('should run basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle string operations', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
});
