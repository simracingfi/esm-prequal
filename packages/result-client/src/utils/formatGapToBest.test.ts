import { describe, expect, it } from 'vitest'
import { formatGapToBest } from './formatGapToBest'

describe('formatGapToBest', () => {
    it('handless minutes', () => {
        expect(formatGapToBest(120, 60)).toBe('+1:00.000')
    })

    it('handles seconds', () => {
        expect(formatGapToBest(12.345, 11.3459)).toBe('+1.000')
    })

    it('handles milliseconds', () => {
        expect(formatGapToBest(1.00294, 1)).toBe('+0.002')
    })

    it('handles invalid input', () => {
        expect(formatGapToBest(null, 1)).toBe('-')
        expect(formatGapToBest(NaN, 1)).toBe('-')
        expect(formatGapToBest(Infinity, 1)).toBe('-')
        expect(formatGapToBest(-1, 1)).toBe('-')
    })
})