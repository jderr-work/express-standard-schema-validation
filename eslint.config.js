import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Possible errors
      'no-console': 'off', // Allow console for examples
      'no-unused-vars': 'off', // Turn off base rule
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for flexibility
      '@typescript-eslint/no-namespace': 'off', // Allow namespaces for Standard Schema types

      // Best practices
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-use-before-define': 'off', // Turn off base rule
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: true,
          classes: true,
          variables: true,
          allowNamedExports: false,
        },
      ],

      // Style (let Prettier handle most formatting)
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],

      // Function declaration rules - enforce arrow functions
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'prefer-arrow-callback': [
        'error',
        {
          allowNamedFunctions: false,
          allowUnboundThis: true,
        },
      ],
    },
  },
  {
    // Ignore patterns
    ignores: ['node_modules/**', 'coverage/**', 'dist/**', '*.config.js', 'example/**/*.js', '.git/**'],
  },
];
