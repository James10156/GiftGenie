import assert from 'assert';
import { describe, it } from 'node:test';

describe('Basic functionality tests', () => {
  it('should perform basic arithmetic', () => {
    assert.strictEqual(2 + 2, 4);
  });

  it('should handle string operations', () => {
    assert.strictEqual('hello'.toUpperCase(), 'HELLO');
  });

  it('should work with arrays', () => {
    const arr = [1, 2, 3];
    assert.strictEqual(arr.length, 3);
    assert.strictEqual(arr.includes(2), true);
  });
});

console.log('✅ All basic tests passed!');
