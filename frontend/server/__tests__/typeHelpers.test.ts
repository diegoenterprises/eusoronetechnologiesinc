import { describe, it, expect } from 'vitest';
import { getUserId, getUserRole, parseLocation, toNumber, getInsertId } from '../utils/typeHelpers';

describe('Type Helpers', () => {
  it('getUserId extracts numeric ID', () => {
    expect(getUserId({ user: { id: 42 } })).toBe(42);
    expect(getUserId({ user: { id: '42' } })).toBe(42);
  });

  it('getUserId throws on missing user', () => {
    expect(() => getUserId({})).toThrow();
    expect(() => getUserId({ user: {} })).toThrow();
  });

  it('parseLocation handles various formats', () => {
    expect(parseLocation({ city: 'Houston', state: 'TX' })).toEqual({ city: 'Houston', state: 'TX' });
    expect(parseLocation(null)).toEqual({});
    expect(parseLocation(undefined)).toEqual({});
    expect(parseLocation('not an object')).toEqual({});
  });

  it('toNumber handles decimals and strings', () => {
    expect(toNumber('2500.50')).toBe(2500.5);
    expect(toNumber(42)).toBe(42);
    expect(toNumber(null)).toBe(0);
    expect(toNumber('not a number', -1)).toBe(-1);
  });

  it('getInsertId extracts from Drizzle result', () => {
    expect(getInsertId([{ insertId: 123 }])).toBe(123);
    expect(getInsertId({ insertId: 456 })).toBe(456);
    expect(getInsertId(null)).toBe(0);
  });
});
