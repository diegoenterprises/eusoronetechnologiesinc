import { describe, it, expect } from 'vitest';
import { toCents, fromCents, calculateFeeInCents, sumCents, subtractCents } from '../utils/money';

describe('Money Utilities', () => {
  it('toCents converts dollars to integer cents', () => {
    expect(toCents(47.50)).toBe(4750);
    expect(toCents('2500.00')).toBe(250000);
    expect(toCents(0.01)).toBe(1);
    expect(toCents(0)).toBe(0);
  });

  it('fromCents converts cents to dollar string', () => {
    expect(fromCents(4750)).toBe('47.50');
    expect(fromCents(250000)).toBe('2500.00');
    expect(fromCents(1)).toBe('0.01');
    expect(fromCents(0)).toBe('0.00');
  });

  it('calculateFeeInCents avoids float errors', () => {
    // 8% of $2,500 should be exactly $200.00 (20000 cents)
    expect(calculateFeeInCents(250000, 8)).toBe(20000);
    // 2.9% of $47.50 should be $1.38 (138 cents)
    expect(calculateFeeInCents(4750, 2.9)).toBe(138);
  });

  it('sumCents accumulates without float drift', () => {
    expect(sumCents('10.10', '20.20', '30.30')).toBe(6060); // 60.60
    expect(fromCents(sumCents('10.10', '20.20', '30.30'))).toBe('60.60');
  });

  it('subtractCents floors at zero', () => {
    expect(subtractCents(100, 50)).toBe(5000);
    expect(subtractCents(10, 20)).toBe(0); // Never negative
  });
});
