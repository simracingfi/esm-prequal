import { describe, expect, it } from 'vitest'
import { formatTime } from './formatTime'

describe('formatTime', () => {
    it('handless minutes', () => {
        expect(formatTime(60)).toBe('1:00.000')
        expect(formatTime(123.4567)).toBe('2:03.456')
        expect(formatTime(92.2267)).toBe('1:32.226')
        expect(formatTime(92.109)).toBe('1:32.109')
    })

    it('handles seconds', () => {
        expect(formatTime(12.3459)).toBe('12.345')
    })

    it('handles milliseconds', () => {
        expect(formatTime(0.00294)).toBe('0.002')
    })

    it('handles invalid input', () => {
        expect(formatTime(null)).toBe('Ei aikaa')
        expect(formatTime(NaN)).toBe('Ei aikaa')
        expect(formatTime(Infinity)).toBe('Ei aikaa')
        expect(formatTime(-1)).toBe('Ei aikaa')
    })
})