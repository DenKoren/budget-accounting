import * as model from "./model";

describe('parseAmountValue', () => {
    it('should parse amount with comma as fraction delimiter and space as thousands delimiter', () => {
        expect(model.parseAmountValue('1000.50')).toBe(1000.50);
    });

    it('should parse amount with different input formats', () => {
        expect(model.parseAmountValue('1000,50')).toBe(1000.50);
        expect(model.parseAmountValue('100050')).toBe(100050);
    });

    it('should return null for invalid amount', () => {
        expect(() => model.parseAmountValue('invalid')).toThrow("Invalid amount value")
    });
});


describe('parseAmount', () => {
    it('should parse amount with comma as fraction delimiter and space as thousands delimiter', () => {
        expect(model.parseAmount('$1000.50')).toEqual({currency: '$', value: 1000.50});
    });

    it('should parse amount with different input formats', () => {
        expect(model.parseAmount('€ 1 000,50')).toEqual({currency: '€', value: 1000.50});
        expect(model.parseAmount('〒100050')).toEqual({currency: '〒', value: 100050});
    });

    it('should throw error for invalid amount', () => {
        expect(() => model.parseAmount('tralala')).toThrow("Invalid amount format")
    });
});
