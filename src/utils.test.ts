import { parseDate, readPartialDate } from './utils';

describe('readPartialDate', () => {
    it('should format partial date with day only', () => {
        expect(readPartialDate('13', parseDate('2024.05.12'))).toEqual(parseDate('2024.05.13'));
    });

    it('should format partial date with month and day', () => {
        expect(readPartialDate('06.15', parseDate('2024.05.12'))).toEqual(parseDate('2024.06.15'));
    });

    it('should format full date', () => {
        expect(readPartialDate('2025.07.20', parseDate('2024.05.12'))).toEqual(parseDate('2025.07.20'));
    });

    it('should throw error for invalid date format', () => {
        expect(() => readPartialDate('invalid', parseDate('2024.05.12'))).toThrow();
    });

    it('should throw error for empty last date and incomplete date 1', () => {
        expect(() => readPartialDate('25')).toThrow();
    });

    it('should throw error for empty last date and incomplete date 2', () => {
        expect(() => readPartialDate('12.25')).toThrow();
    });
});
