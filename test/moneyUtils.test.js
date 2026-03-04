import { describe, it, expect } from 'vitest';
import { toCents, toDollarsData, formatCurrency, isBalanced } from '../src/utils/moneyUtils';

describe('moneyUtils', () => {
    describe('toCents', () => {
        it('should correctly convert whole dollars to cents', () => {
            expect(toCents(1)).toBe(100);
            expect(toCents('5')).toBe(500);
        });

        it('should correctly convert decimals avoiding floating point errors', () => {
            expect(toCents(1.99)).toBe(199);
            expect(toCents('10.05')).toBe(1005);
            // Javascript infamous 0.1 + 0.2 === 0.30000000000000004 issue
            expect(toCents(0.1 + 0.2)).toBe(30);
        });

        it('should truncate beyond 2 decimal places rigidly', () => {
            expect(toCents('1.999')).toBe(199); // Drops trailing partial cents
        });
    });

    describe('toDollarsData', () => {
        it('should format cents into a string dollar format', () => {
            expect(toDollarsData(199)).toBe('1.99');
            expect(toDollarsData(5)).toBe('0.05');
            expect(toDollarsData(1000)).toBe('10.00');
            expect(toDollarsData(0)).toBe('0.00');
        });
    });

    describe('formatCurrency', () => {
        it('should prepend a dollar sign', () => {
            expect(formatCurrency(199)).toBe('$1.99');
        });
    });

    describe('isBalanced', () => {
        it('should return true if net amount is exactly zero cents', () => {
            expect(isBalanced([1000, -1000])).toBe(true);
            expect(isBalanced([500, 500, -1000])).toBe(true);
        });

        it('should return false if net amount is NOT zero cents', () => {
            expect(isBalanced([1000, -999])).toBe(false); // Off by 1 cent
            expect(isBalanced([500, 500, -1001])).toBe(false); // Off by -1 cent
        });
    });
});
