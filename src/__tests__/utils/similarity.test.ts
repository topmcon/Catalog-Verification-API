import {
  jaccardSimilarity,
  levenshteinSimilarity,
  compareValues,
  compareArrays,
  compareObjects,
} from '../../utils/similarity';

describe('Similarity Utility', () => {
  describe('jaccardSimilarity', () => {
    it('should return 1 for identical sets', () => {
      const set1 = new Set(['a', 'b', 'c']);
      const set2 = new Set(['a', 'b', 'c']);
      expect(jaccardSimilarity(set1, set2)).toBe(1);
    });

    it('should return 0 for completely different sets', () => {
      const set1 = new Set(['a', 'b', 'c']);
      const set2 = new Set(['x', 'y', 'z']);
      expect(jaccardSimilarity(set1, set2)).toBe(0);
    });

    it('should return correct value for partial overlap', () => {
      const set1 = new Set(['a', 'b', 'c']);
      const set2 = new Set(['b', 'c', 'd']);
      // Intersection: {b, c} = 2
      // Union: {a, b, c, d} = 4
      expect(jaccardSimilarity(set1, set2)).toBe(0.5);
    });

    it('should return 1 for two empty sets', () => {
      const set1 = new Set<string>();
      const set2 = new Set<string>();
      expect(jaccardSimilarity(set1, set2)).toBe(1);
    });
  });

  describe('levenshteinSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(levenshteinSimilarity('hello', 'hello')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      expect(levenshteinSimilarity('abc', 'xyz')).toBe(0);
    });

    it('should handle case insensitivity', () => {
      expect(levenshteinSimilarity('Hello', 'hello')).toBe(1);
    });

    it('should return correct similarity for similar strings', () => {
      const similarity = levenshteinSimilarity('kitten', 'sitting');
      expect(similarity).toBeGreaterThan(0.5);
      expect(similarity).toBeLessThan(1);
    });

    it('should handle empty strings', () => {
      expect(levenshteinSimilarity('', '')).toBe(1);
      expect(levenshteinSimilarity('abc', '')).toBe(0);
    });
  });

  describe('compareValues', () => {
    it('should return 1 for identical values', () => {
      expect(compareValues('hello', 'hello')).toBe(1);
      expect(compareValues(123, 123)).toBe(1);
      expect(compareValues(true, true)).toBe(1);
    });

    it('should return 0 for completely different values', () => {
      expect(compareValues(true, false)).toBe(0);
    });

    it('should handle null/undefined', () => {
      expect(compareValues(null, null)).toBe(1);
      expect(compareValues(undefined, undefined)).toBe(1);
      expect(compareValues(null, undefined)).toBe(1);
      expect(compareValues(null, 'value')).toBe(0);
    });

    it('should compare numbers with tolerance', () => {
      expect(compareValues(100, 100)).toBe(1);
      const similarity = compareValues(100, 110);
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should compare strings using levenshtein', () => {
      const similarity = compareValues('hello', 'hallo');
      expect(similarity).toBeGreaterThan(0.5);
    });
  });

  describe('compareArrays', () => {
    it('should return 1 for identical arrays', () => {
      expect(compareArrays([1, 2, 3], [1, 2, 3])).toBe(1);
    });

    it('should return 0 for completely different arrays', () => {
      expect(compareArrays(['a', 'b'], ['x', 'y'])).toBe(0);
    });

    it('should return 1 for two empty arrays', () => {
      expect(compareArrays([], [])).toBe(1);
    });

    it('should handle partial matches', () => {
      const similarity = compareArrays([1, 2, 3], [1, 2, 4]);
      expect(similarity).toBeGreaterThan(0.5);
    });
  });

  describe('compareObjects', () => {
    it('should return 1 for identical objects', () => {
      const obj = { a: 1, b: 'hello' };
      expect(compareObjects(obj, obj)).toBe(1);
    });

    it('should handle different keys', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, c: 3 };
      const similarity = compareObjects(obj1, obj2);
      expect(similarity).toBeLessThan(1);
    });

    it('should return 1 for two empty objects', () => {
      expect(compareObjects({}, {})).toBe(1);
    });
  });
});
