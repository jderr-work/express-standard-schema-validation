# express-standard-schema-validation

This package is derived from [Evan Shortiss'](https://github.com/evanshortiss) [express-joi-validation](https://github.com/evanshortiss/express-joi-validation)
Credit goes to him for the original implementation.

This package is an Express middleware for validating requests using a library that implements [Standard Schema V1](https://github.com/standard-schema/standard-schema) interface.

One divergence from the original package is that the joi package supported joi specific options. Because that is a
library specific feature, any options will need to be set on the schema itself.

The tests have been using **Joi**, **Zod**, **ArkType**, and **Valibot** but any library that implements Standard Schema V1 should work.

## Features

- 🎯 **Multi-Library Support** - Will work with any validation library implementing Standard Schema V1
- 📘 **TypeScript First** - Written in TypeScript with full type safety and intellisense
- 🔄 **Value Replacement** - Replaces validated inputs (e.g., `req.body`) with validated/transformed values
- 💾 **Original Value Retention** - Keeps original values in `req.originalBody`, `req.originalQuery`, etc.
- 🎨 **Flexible Configuration** - Configure validation behavior per-route or globally
- ⚡ **Standard Schema V1** - Built on the Standard Schema specification

## Install

```bash
npm install express-standard-schema-validation
```

Then install your preferred validation library:
This has been tested with: zod, joi, arktype, valibot

## Quick Start

### Using Joi

```js
const Joi = require('joi');
const express = require('express');
const { createValidator } = require('express-standard-schema-validation');

const app = express();
const validator = createValidator();

const querySchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().integer().min(0),
});

app.get('/hello', validator.query(querySchema), (req, res) => {
  res.json({ message: `Hello ${req.query.name}!` });
});
```

### Using Zod

```js
const { z } = require('zod');
const express = require('express');
const { createValidator } = require('express-standard-schema-validation');

const app = express();
const validator = createValidator();

const querySchema = z.object({
  name: z.string(),
  age: z.coerce.number().int().min(0),
});

app.get('/hello', validator.query(querySchema), (req, res) => {
  res.json({ message: `Hello ${req.query.name}!` });
});
```

### Using ArkType

```js
const { type } = require('arktype');
const express = require('express');
const { createValidator } = require('express-standard-schema-validation');

const app = express();
const validator = createValidator();

const querySchema = type({
  name: 'string',
  age: 'string.numeric.parse',
});

app.get('/hello', validator.query(querySchema), (req, res) => {
  res.json({ message: `Hello ${req.query.name}!` });
});
```

### Using Valibot

```js
const v = require('valibot');
const express = require('express');
const { createValidator } = require('express-standard-schema-validation');

const app = express();
const validator = createValidator();

const querySchema = v.object({
  name: v.string(),
  age: v.pipe(v.string(), v.transform(Number), v.number(), v.minValue(0)),
});

app.get('/hello', validator.query(querySchema), (req, res) => {
  res.json({ message: `Hello ${req.query.name}!` });
});
```

## API Reference

### `createValidator(config)`

Creates a validator instance with optional global configuration.

**Parameters:**

- `config.passError` (boolean, default: `false`) - Pass validation errors to Express error handler
- `config.statusCode` (number, default: `400`) - HTTP status code for validation failures

**Returns:** Validator instance with middleware methods

**Example:**

```js
const validator = createValidator({
  passError: true,
  statusCode: 422,
});
```

### Validator Methods

All methods accept a schema and optional configuration that overrides global settings.

#### `validator.query(schema, [options])`

Validates `req.query`. Original value stored in `req.originalQuery`.

```js
app.get('/search', validator.query(searchSchema), handler);
```

#### `validator.body(schema, [options])`

Validates `req.body`. Original value stored in `req.originalBody`.

```js
app.post('/users', validator.body(userSchema), handler);
```

#### `validator.params(schema, [options])`

Validates `req.params`. Original value stored in `req.originalParams`.

**Important:** Must be attached directly to the route:

```js
// ✅ CORRECT
app.get('/users/:id', validator.params(idSchema), handler);

// ❌ INCORRECT - won't work
app.use(validator.params(idSchema));
app.get('/users/:id', handler);
```

#### `validator.headers(schema, [options])`

Validates `req.headers`. Original value stored in `req.originalHeaders`.

```js
app.get('/api', validator.headers(authSchema), handler);
```

#### `validator.fields(schema, [options])`

Validates form fields (for use with `express-formidable`). Original value stored in `req.originalFields`.

```js
app.post('/upload', formidable(), validator.fields(fieldsSchema), handler);
```

#### `validator.response(schema, [options])`

Validates outgoing response data.

```js
app.get('/users/:id', validator.response(userSchema), handler);
```

### Options Object

Each validator method accepts an optional `options` parameter:

```js
{
  passError: boolean,   // Override global passError setting
  statusCode: number    // Override global statusCode setting
}
```

## Library-Specific Configuration

**Important:** With Standard Schema, validation behavior should be configured **on the schema itself**, not via middleware options.

### Joi Configuration

Configure Joi schemas using Joi's built-in methods:

```js
const schema = Joi.object({
  name: Joi.string().required(),
  extra: Joi.any(),
})
  .unknown(true) // Allow extra properties
  .options({
    convert: true, // Type coercion
    abortEarly: false, // Return all errors
  });
```

### Zod Configuration

Configure Zod schemas using Zod's built-in methods:

```js
const schema = z
  .object({
    name: z.string(),
    age: z.coerce.number(), // Type coercion
  })
  .strict(); // Reject extra properties
// .passthrough()         // Allow extra properties
// .strip()               // Remove extra properties (default)
```

### ArkType Configuration

Configure validation directly in ArkType's syntax:

```js
const schema = type({
  name: 'string',
  age: 'string.numeric.parse', // Parse string to number
  score: 'number>0<100', // Number between 0 and 100
});
```

### Valibot Configuration

Configure Valibot schemas using pipes and modifiers:

```js
const schema = v.object({
  name: v.string(),
  age: v.pipe(v.string(), v.transform(Number), v.number()),
});
// v.strictObject() - Reject extra properties
// v.looseObject()  - Allow extra properties
```

## Library Migration Guide

### Joi → Zod

| Joi                                 | Zod                 |
| ----------------------------------- | ------------------- |
| `Joi.number()` with `convert: true` | `z.coerce.number()` |
| `.unknown(true)`                    | `.passthrough()`    |
| `.unknown(false)`                   | `.strict()`         |
| `.options({ stripUnknown: true })`  | Default behavior    |
| `.options({ abortEarly: false })`   | Default behavior    |

### Joi → ArkType

| Joi                                 | ArkType                  |
| ----------------------------------- | ------------------------ |
| `Joi.number()` with `convert: true` | `'string.numeric.parse'` |
| `Joi.number().min(0).max(100)`      | `'number>-1<101'`        |
| `Joi.string().min(3).max(20)`       | `'string>2<21'`          |
| `Joi.string().valid('a', 'b')`      | `'"a" \| "b"'`           |

### Joi → Valibot

| Joi                                 | Valibot                                               |
| ----------------------------------- | ----------------------------------------------------- |
| `Joi.number()` with `convert: true` | `v.pipe(v.string(), v.transform(Number), v.number())` |
| `Joi.number().min(0).max(100)`      | `v.pipe(v.number(), v.minValue(0), v.maxValue(100))`  |
| `.unknown(true)`                    | `v.looseObject()`                                     |
| `.unknown(false)`                   | `v.strictObject()`                                    |

## Error Handling

### Default Behavior

By default, validation failures return HTTP 400 with error message as plain text:

```js
// Request: GET /hello?name=123&age=invalid
// Response: 400 Bad Request
// Body: Error validating request query. Expected string, received number. Age must be a number.
```

### Custom Error Handler

Use `passError: true` to handle errors with Express error middleware:

```js
const validator = createValidator({ passError: true });

app.get('/hello', validator.query(schema), handler);

app.use((err, req, res, next) => {
  if (err && err.error) {
    return res.status(400).json({
      type: err.type, // 'query', 'body', 'params', 'headers', or 'fields'
      message: err.error.message,
      issues: err.issues, // Array of Standard Schema issues
    });
  }
  next(err);
});
```

### TypeScript Error Handling

```ts
import { ExpressValidatorError, ContainerTypes } from 'express-standard-schema-validation';

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && 'type' in err && err.type in ContainerTypes) {
    const validationError = err as ExpressValidatorError;
    return res.status(400).json({
      type: validationError.type,
      issues: validationError.issues,
    });
  }
  next(err);
});
```

## TypeScript Usage

### Basic TypeScript Example

```ts
import { z } from 'zod';
import express from 'express';
import {
  createValidator,
  ValidatedRequest,
  ValidatedRequestSchema,
  ContainerTypes,
} from 'express-standard-schema-validation';

const app = express();
const validator = createValidator();

const querySchema = z.object({
  name: z.string(),
  age: z.coerce.number(),
});

interface HelloRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Query]: z.infer<typeof querySchema>;
}

app.get('/hello', validator.query(querySchema), (req: ValidatedRequest<HelloRequestSchema>, res) => {
  // req.query.name is string
  // req.query.age is number
  res.json({ message: `Hello ${req.query.name}!` });
});
```

### Multiple Validations

```ts
const headerSchema = z.object({
  'x-api-key': z.string(),
});

const bodySchema = z.object({
  email: z.string().email(),
  age: z.number(),
});

interface CreateUserSchema extends ValidatedRequestSchema {
  [ContainerTypes.Headers]: z.infer<typeof headerSchema>;
  [ContainerTypes.Body]: z.infer<typeof bodySchema>;
}

app.post(
  '/users',
  validator.headers(headerSchema),
  validator.body(bodySchema),
  (req: ValidatedRequest<CreateUserSchema>, res) => {
    // Fully typed access to headers and body
    const apiKey = req.headers['x-api-key'];
    const { email, age } = req.body;
    res.json({ success: true });
  },
);
```

## Validation Order

Validators execute in the order they're passed to the route:

```js
app.post(
  '/tickets',
  validator.headers(headerSchema), // Validates first
  validator.body(bodySchema), // Validates second
  validator.query(querySchema), // Validates third
  handler,
);
```

If any validation fails, subsequent validators and the handler won't execute.

## Original Values

Original (pre-validation) values are preserved:

```js
const schema = z.object({
  age: z.coerce.number(),
});

app.get('/test', validator.query(schema), (req, res) => {
  console.log(req.originalQuery.age); // "25" (string)
  console.log(req.query.age); // 25 (number)
});
```

Available original properties:

- `req.originalQuery`
- `req.originalBody`
- `req.originalParams`
- `req.originalHeaders`
- `req.originalFields`

## Examples

Full JavaScript and TypeScript examples are in the [`example/`](./example) directory.

## Development

### Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0

### Setup

```bash
git clone https://github.com/jderr-work/express-standard-schema-validation.git
cd express-standard-schema-validation
npm install
```

### Running Checks

Run all verification checks (what CI runs):

```bash
npm run verify
```

This runs:

- ✅ Code formatting check (Prettier)
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ All tests (Vitest)
- ✅ Build verification

Run quick verification (skips tests, runs on pre-commit):

```bash
npm run verify:quick
```

Run individual checks:

```bash
npm run format:check  # Check code formatting
npm run format        # Auto-fix formatting
npm run lint          # Check code quality
npm run lint:fix      # Auto-fix linting issues
npm run type-check    # Check TypeScript types
npm test              # Run all tests
npm run test:unit     # Run unit tests only (watch mode)
npm run test:acceptance # Run acceptance tests only (watch mode)
npm run build         # Build the package
npm run coverage      # Generate coverage report
```

### Pre-commit Hooks

This project uses [simple-git-hooks](https://github.com/toplenboren/simple-git-hooks) to automatically run `verify:quick` before each commit. This ensures code quality and catches issues early.

If you need to bypass the pre-commit hook (not recommended):

```bash
git commit --no-verify -m "message"
```

### Code Coverage

This project maintains **100% code coverage**. All tests must pass with 100% coverage for:

- Lines
- Functions
- Branches
- Statements

Coverage reports are automatically generated and uploaded to Coveralls on CI builds.

### CI/CD

This project uses GitHub Actions for continuous integration:

- **All checks** (format, lint, type-check, tests, build) run on every Node.js version (18, 20, 22) and Express version (4, 5)
- **Coverage** is uploaded to Coveralls and must maintain 100%
- **CI runs** on all PRs and pushes to `main` branch
- **CI skips** for documentation-only changes (\*.md files)

See [.github/workflows/ci.yaml](.github/workflows/ci.yaml) for the complete CI configuration.

### Testing with Different Validators

The test suite includes acceptance tests for all supported validation libraries:

```bash
# All validators are tested by default
npm test

# Run specific validator tests
npm run test:acceptance -- joi.test.ts
npm run test:acceptance -- zod.test.ts
npm run test:acceptance -- arktype.test.ts
npm run test:acceptance -- valibot.test.ts
```

## Standard Schema Support

This module validates that schemas implement the [Standard Schema V1](https://github.com/standard-schema/standard-schema) interface:

```js
{
  '~standard': {
    version: 1,
    vendor: string,
    validate: (value: unknown) => Promise<Result>
  }
}
```

Supported libraries and minimum versions:

- **Joi** >= 18.0.0
- **Zod** >= 3.23.0
- **ArkType** >= 2.0.0-rc
- **Valibot** >= 1.0.0

## Migration from express-joi-validation

This module is a fork of [express-joi-validation](https://github.com/evanshortiss/express-joi-validation) with Standard Schema support.

### Breaking Changes

1. **No library options parameter** - Configure validation on schemas, not middleware
2. **Package name** - `express-joi-validation` → `express-standard-schema-validation`
3. **Multi-library support** - Works with Joi, Zod, ArkType, and Valibot

### Migration Steps

```diff
- const validator = require('express-joi-validation').createValidator({
-   joi: { convert: true, allowUnknown: false }
- })
+ const validator = require('express-standard-schema-validation').createValidator()

- const schema = Joi.object({ name: Joi.string() })
+ const schema = Joi.object({ name: Joi.string() })
+   .options({ convert: true, allowUnknown: false })

  app.get('/hello', validator.query(schema), handler)
```

## License

MIT

## Credits

Original [express-joi-validation](https://github.com/evanshortiss/express-joi-validation) by Evan Shortiss.

Standard Schema support and multi-library architecture by the contributors to this fork.
