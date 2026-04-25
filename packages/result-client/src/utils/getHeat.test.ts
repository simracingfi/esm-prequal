import { describe, expect, it } from 'vitest'
import { getHeat } from './getHeat'

describe('getHeat', () => {
    it('returns only A up to 30', () => {
        expect(getHeat(1, 30)).toBe('A');
        expect(getHeat(30, 30)).toBe('A');
    });

    it('returns B from 28 when A flows over (more than 30 drivers)', () => {
        expect(getHeat(27, 31)).toBe('A');
        expect(getHeat(28, 31)).toBe('B');
        expect(getHeat(31, 31)).toBe('B');
    });

    it('B has bigger grid than C when drivers overflow to 3 heats (at 53 drivers)', () => {
        // 27 to A, 26 to B+C
        expect(getHeat(27, 53)).toBe('A');
        // 12 (28-39) to B + 3 promoted = 15 grid in B
        expect(getHeat(28, 53)).toBe('B');
        expect(getHeat(39, 53)).toBe('B');
        // 14 (40-53) grid in C
        expect(getHeat(40, 53)).toBe('C');
        expect(getHeat(53, 53)).toBe('C');
    });

    it('B and C equal at 54 drivers', () => {
        // 27 to A, 26 to B+C
        expect(getHeat(27, 54)).toBe('A');
        // 12 (28-39) to B + 3 promoted = 15 grid in B
        expect(getHeat(28, 54)).toBe('B');
        expect(getHeat(39, 54)).toBe('B');
        // 15 (40-54) grid in C
        expect(getHeat(40, 54)).toBe('C');
        expect(getHeat(54, 54)).toBe('C');
    });

    it('No D yet at 74 drivers', () => {
        // 27 to A, 26 to B+C
        expect(getHeat(27, 74)).toBe('A');
        // 22 (28-49) to B + 3 promoted = 25 grid in B
        expect(getHeat(28, 74)).toBe('B');
        expect(getHeat(49, 74)).toBe('B');
        // 25 (50-74) grid in C
        expect(getHeat(50, 74)).toBe('C');
        expect(getHeat(74, 74)).toBe('C');
    });

    it('Equal 18 driver B-D grids at 75 drivers', () => {
        // 27 to A, 52 to B+C+D
        expect(getHeat(27, 75)).toBe('A');
        // 15 (28-42) to B + 3 promoted = 18 grid in B
        expect(getHeat(28, 75)).toBe('B');
        expect(getHeat(42, 75)).toBe('B');
        // 15 (43-57) to C + 3 promoted = 18 grid in C
        expect(getHeat(43, 75)).toBe('C');
        expect(getHeat(57, 75)).toBe('C');
        // 18 (58-75) grid in D
        expect(getHeat(58, 75)).toBe('D');
        expect(getHeat(75, 75)).toBe('D');
    });

    it('Equal 25 driver B-D grids at 96 drivers', () => {
        // 27 to A, 69 to B+C+D
        expect(getHeat(27, 96)).toBe('A');
        // 22 (28-49) to B + 3 promoted = 25 grid in B
        expect(getHeat(28, 96)).toBe('B');
        expect(getHeat(49, 96)).toBe('B');
        // 22 (50-71) to C + 3 promoted = 25 grid in C
        expect(getHeat(50, 96)).toBe('C');
        expect(getHeat(71, 96)).toBe('C');
        // 25 (72-96) grid in D
        expect(getHeat(72, 96)).toBe('D');
        expect(getHeat(96, 96)).toBe('D');
    });

    it('Last flows over from heats at 97 drivers', () => {
        expect(getHeat(96, 97)).toBe('D');
        expect(getHeat(97, 97)).toBe('Ei erää');
    });
})
