import { parseDate, readPartialDate, smartSearch, searchWords, searchCapital } from './utils';

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

describe('smartSearch', () => {
    it('should return all values if term is empty', () => {
        expect(smartSearch('', ['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should find by prefix', () => {
        expect(smartSearch('aa', ['aaa', 'abb', 'acc'])).toEqual(['aaa']);
    });

    it('case insensitive', () => {
        expect(smartSearch('a b c', ['aa bb cc', 'bb cc aa', 'cc bb aa'])).toEqual(['aa bb cc']);
    });

    it('prefix is preferred', () => {
        expect(smartSearch('a b c', ['xa xb xc', 'a b c d'])).toEqual(['a b c d', 'xa xb xc']);
    });
})


describe('searchWords', () => {
    it('partial match works', () => {
        expect(searchWords('a b c', 'aa bb cc')).toEqual(true);
    });

    it('order matters 2', () => {
        expect(searchWords('a b c', 'bb cc aa')).toEqual(false);
    });

    it('any part of the word', () => {
        expect(searchWords('a b c', 'beacon bubble crane')).toEqual(true);
    });
})

describe('searchCapital', () => {
    it('full abbreviation', () => {
        expect(searchCapital('TIAT', 'ThisIsATest')).toEqual(true);
    });

    it('partial abbreviation', () => {
        expect(searchCapital('TT', 'ThisIsATest')).toEqual(true);
    });

    it('order matters', () => {
        expect(searchCapital('TAI', 'ThisIsATest')).toEqual(false);
    });
})
