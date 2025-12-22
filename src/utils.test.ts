import { describe, test, expect } from 'vitest';
import { isStandardSchema, buildErrorString } from './utils.js';
import { StandardSchemaV1 } from './types.js';

describe('isStandardSchema', () => {
  test('should return true for valid Standard Schema with all required properties', () => {
    const validSchema = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: () => ({ value: {} }),
      },
    };

    expect(isStandardSchema(validSchema)).toBe(true);
  });

  test('should return false for null', () => {
    expect(isStandardSchema(null)).toBe(false);
  });

  test('should return false for undefined', () => {
    expect(isStandardSchema(undefined)).toBe(false);
  });

  test('should return false for string primitive', () => {
    expect(isStandardSchema('not a schema')).toBe(false);
  });

  test('should return false for number primitive', () => {
    expect(isStandardSchema(123)).toBe(false);
  });

  test('should return false for boolean primitive', () => {
    expect(isStandardSchema(true)).toBe(false);
  });

  test('should return false for object without ~standard property', () => {
    const invalidSchema = { validate: () => {} };
    expect(isStandardSchema(invalidSchema)).toBe(false);
  });

  test('should return false when ~standard is null', () => {
    const invalidSchema = {
      '~standard': null,
    };
    expect(isStandardSchema(invalidSchema)).toBe(false);
  });

  test('should return false when ~standard is undefined', () => {
    const invalidSchema = {
      '~standard': undefined,
    };
    expect(isStandardSchema(invalidSchema)).toBe(false);
  });

  test('should return false when ~standard is not an object', () => {
    const invalidSchema = {
      '~standard': 'not an object',
    };
    expect(isStandardSchema(invalidSchema)).toBe(false);
  });

  test('should return false when version is missing', () => {
    const invalidSchema = {
      '~standard': {
        vendor: 'test',
        validate: () => ({ value: {} }),
      },
    };
    expect(isStandardSchema(invalidSchema)).toBe(false);
  });

  test('should return false when version is not 1', () => {
    const invalidSchema = {
      '~standard': {
        version: 2,
        vendor: 'test',
        validate: () => ({ value: {} }),
      },
    };
    expect(isStandardSchema(invalidSchema)).toBe(false);
  });

  test('should return false when vendor is missing', () => {
    const invalidSchema = {
      '~standard': {
        version: 1,
        validate: () => ({ value: {} }),
      },
    };
    expect(isStandardSchema(invalidSchema)).toBe(false);
  });

  test('should return false when vendor is not a string', () => {
    const invalidSchema = {
      '~standard': {
        version: 1,
        vendor: 123,
        validate: () => ({ value: {} }),
      },
    };
    expect(isStandardSchema(invalidSchema)).toBe(false);
  });

  test('should return false when validate is missing', () => {
    const invalidSchema = {
      '~standard': {
        version: 1,
        vendor: 'test',
      },
    };
    expect(isStandardSchema(invalidSchema)).toBe(false);
  });

  test('should return false when validate is not a function', () => {
    const invalidSchema = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: 'not a function',
      },
    };
    expect(isStandardSchema(invalidSchema)).toBe(false);
  });

  test('should return true for function with ~standard property', () => {
    const schemaFunction = (() => {}) as any;
    schemaFunction['~standard'] = {
      version: 1,
      vendor: 'test',
      validate: () => ({ value: {} }),
    };

    expect(isStandardSchema(schemaFunction)).toBe(true);
  });

  test('should accept schema with optional types property', () => {
    const validSchema = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: () => ({ value: {} }),
        types: {
          input: {},
          output: {},
        },
      },
    };

    expect(isStandardSchema(validSchema)).toBe(true);
  });
});

describe('buildErrorString', () => {
  test('should build error string from single issue', () => {
    const issues: StandardSchemaV1.Issue[] = [{ message: 'Field is required' }];

    const result = buildErrorString(issues, 'query');

    expect(result).toBe('Error validating query: Field is required');
  });

  test('should build error string using errorMessageTemplate option', () => {
    const issues: StandardSchemaV1.Issue[] = [{ message: 'Field is required' }];

    const result = buildErrorString(issues, 'query', 'Custom error message:');

    expect(result).toBe('Custom error message: Field is required');
  });

  test('should build error string from multiple issues', () => {
    const issues: StandardSchemaV1.Issue[] = [
      { message: 'Field is required' },
      { message: 'Must be a number' },
      { message: 'Must be greater than 0' },
    ];

    const result = buildErrorString(issues, 'body');

    expect(result).toBe('Error validating body: Field is required. Must be a number. Must be greater than 0');
  });

  test('should handle empty issues array', () => {
    const issues: StandardSchemaV1.Issue[] = [];

    const result = buildErrorString(issues, 'params');

    expect(result).toBe('Error validating params:');
  });

  test('should handle issues with paths', () => {
    const issues: StandardSchemaV1.Issue[] = [
      {
        message: 'Invalid email',
        path: ['user', 'email'],
      },
    ];

    const result = buildErrorString(issues, 'body');

    expect(result).toBe('Error validating body: Invalid email');
  });
});
