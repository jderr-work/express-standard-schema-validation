import { StandardSchemaV1 } from './types.js';

/**
 * Checks if a schema implements the Standard Schema V1 interface
 * @param schema - The schema to check
 * @returns True if the schema implements Standard Schema V1
 */
export const isStandardSchema = (schema: unknown): schema is StandardSchemaV1 => {
  return (
    schema !== null &&
    schema !== undefined &&
    (typeof schema === 'object' || typeof schema === 'function') &&
    '~standard' in schema &&
    schema['~standard'] !== null &&
    schema['~standard'] !== undefined &&
    typeof schema['~standard'] === 'object' &&
    '~standard' in schema &&
    typeof (schema['~standard'] as any).validate === 'function' &&
    (schema['~standard'] as any).version === 1
  );
};

/**
 * Validates that the provided schema implements Standard Schema V1
 * @param schema - The schema to validate
 * @throws Error if the schema does not implement Standard Schema V1
 */
export const assertStandardSchema = (schema: unknown): asserts schema is StandardSchemaV1 => {
  if (!isStandardSchema(schema)) {
    throw new Error('Invalid schema: must implement Standard Schema V1 interface.');
  }
};

/**
 * Builds an error string from Standard Schema validation issues
 * @param issues - Array of Standard Schema issues
 * @param container - The container being validated (e.g., "query", "body")
 * @returns Formatted error message
 */
export const buildErrorString = (issues: ReadonlyArray<StandardSchemaV1.Issue>, container: string): string => {
  let ret = `Error validating ${container}.`;

  for (let i = 0; i < issues.length; i++) {
    ret += ` ${issues[i].message}.`;
  }

  return ret;
};
