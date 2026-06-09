import { parsePositiveSeconds } from '@/utils/parse-number';

describe('parsePositiveSeconds', () => {
  it('parses trimmed positive values with dot or comma decimal separators', () => {
    expect(parsePositiveSeconds(' 1.25 ')).toBe(1.25);
    expect(parsePositiveSeconds('2,5')).toBe(2.5);
  });

  it('rejects blank, zero, negative, and non-numeric values', () => {
    expect(parsePositiveSeconds('')).toBeNull();
    expect(parsePositiveSeconds('0')).toBeNull();
    expect(parsePositiveSeconds('-1')).toBeNull();
    expect(parsePositiveSeconds('abc')).toBeNull();
  });
});
