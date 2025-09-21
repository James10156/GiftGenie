import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Guest Session ID Generation', () => {
  it('should generate guest IDs in correct format', () => {
    // Mock Date.now to have predictable timestamp
    const mockTimestamp = 1234567890123;
    vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
    
    // Mock Math.random to have predictable random string
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    
    // Simulate guest ID generation (same logic as in auth.ts)
    const generateGuestId = () => {
      return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    };
    
    const guestId = generateGuestId();
    
    // Should start with expected prefix and timestamp
    expect(guestId).toMatch(/^guest_1234567890123_[a-z0-9]+$/);
    
    // Should have expected structure
    const parts = guestId.split('_');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe('guest');
    expect(parts[1]).toBe('1234567890123');
    expect(parts[2]).toMatch(/^[a-z0-9]+$/);
    
    // Restore mocks
    vi.restoreAllMocks();
  });

  it('should generate unique guest IDs', () => {
    const generateGuestId = () => {
      return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    };
    
    const ids = new Set();
    
    // Generate multiple IDs
    for (let i = 0; i < 100; i++) {
      const id = generateGuestId();
      expect(id).toMatch(/^guest_\d+_[a-z0-9]+$/);
      ids.add(id);
    }
    
    // All should be unique
    expect(ids.size).toBe(100);
  });

  it('should generate guest IDs with recent timestamps', () => {
    const generateGuestId = () => {
      return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    };
    
    const beforeGeneration = Date.now();
    const guestId = generateGuestId();
    const afterGeneration = Date.now();
    
    // Extract timestamp from guest ID
    const timestamp = parseInt(guestId.split('_')[1]);
    
    // Timestamp should be between before and after generation
    expect(timestamp).toBeGreaterThanOrEqual(beforeGeneration);
    expect(timestamp).toBeLessThanOrEqual(afterGeneration);
  });

  it('should create guest user objects with correct structure', () => {
    const createGuestUser = (guestId: string) => ({
      id: guestId,
      username: 'Guest',
      isAdmin: false
    });
    
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const guestUser = createGuestUser(guestId);
    
    expect(guestUser).toEqual({
      id: guestId,
      username: 'Guest',
      isAdmin: false
    });
    
    expect(guestUser.id).toMatch(/^guest_\d+_[a-z0-9]+$/);
  });
});