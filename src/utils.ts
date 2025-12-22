import { StandardSchemaV1 } from './types.js';

/**
 * Checks if a schema implements the Standard Schema V1 interface
 * @param schema - The schema to check
 * @returns True if the schema implements Standard Schema V1
 */
export const isStandardSchema = (schema: unknown): schema is StandardSchemaV1 => {
  if (!schema || (typeof schema !== 'object' && typeof schema !== 'function')) {
    return false;
  }

  const std = (schema as any)['~standard'];

  return (
    std !== null &&
    std !== undefined &&
    typeof std === 'object' &&
    std.version === 1 &&
    typeof std.vendor === 'string' &&
    typeof std.validate === 'function'
  );
};

/**
 * Builds an error string from Standard Schema validation issues
 * @param issues - Array of Standard Schema issues
 * @param container - The container being validated (e.g., "query", "body")
 * @param errorStringTemplate - Optional template for formatting error messages
 * @returns Formatted error message
 */
export const buildErrorString = (
  issues: ReadonlyArray<StandardSchemaV1.Issue>,
  container: string,
  errorStringTemplate?: string,
): string => {
  const prefix = errorStringTemplate || `Error validating ${container}:`;
  if (!issues.length) return prefix;

  const issueString = issues.map(({ message }) => message).join('. ');

  return `${prefix} ${issueString}`;
};
