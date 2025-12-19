# express-standard-schema-validation

This package id dervied from [Evan Shortiss'](https://github.com/evanshortiss) [express-joi-validation](https://github.com/evanshortiss/express-joi-validation)
Credit goes to him for the original implementation.

This package is an express middleware for validating requests using a libary that implements [Standard Schema V1](https://github.com/standard-schema/standard-schema) interface.

One divergence from the original package it that the joi package supported joi specific options. Because that is a
libary specific feature, any options will need to be set on the schema itself.

The tests have been using **Joi**, **Zod**, **ArkType**, and **Valibot** but any library that implements Standard Schema V1 should work.

## Features

- 🎯 **Multi-Library Support** - Works with Joi, Zod, ArkType, and Valibot
- 📘 **TypeScript Support** - Full type safety and intellisense
- 🔄 **Value Replacement** - Replaces validated inputs (e.g., `req.body`) with validated/transformed values
- 💾 **Original Value Retention** - Keeps original values in `req.originalBody`, `req.originalQuery`, etc.
- 🎨 **Flexible Configuration** - Configure validation behavior per-route or globally
- ⚡ **Standard Schema V1** - Built on the Standard Schema specification

## Install

```bash
npm install express-standard-schema-validation
```

Then install your preferred validation library:

```bash
# Choose one or more:
npm install joi        # Joi >= 18.0.0
npm install zod        # Zod >= 3.23.0
npm install arktype    # ArkType >= 2.0.0-rc
npm install valibot    # Valibot >= 1.0.0
```

## Quick Start

### Using Joi

```js
const Joi = require('joi')
const express = require('express')
const { createValidator } = require('express-standard-schema-validation')

const app = express()
const validator = createValidator()

const querySchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number()
    .integer()
    .min(0)
})

app.get('/hello', validator.query(querySchema), (req, res) => {
  res.json({ message: `Hello ${req.query.name}!` })
})
```

### Using Zod

```js
const { z } = require('zod')
const express = require('express')
const { createValidator } = require('express-standard-schema-validation')

const app = express()
const validator = createValidator()

const querySchema = z.object({
  name: z.string(),
  age: z.coerce
    .number()
    .int()
    .min(0)
})

app.get('/hello', validator.query(querySchema), (req, res) => {
  res.json({ message: `Hello ${req.query.name}!` })
})
```

### Using ArkType

```js
const { type } = require('arktype')
const express = require('express')
const { createValidator } = require('express-standard-schema-validation')

const app = express()
const validator = createValidator()

const querySchema = type({
  name: 'string',
  age: 'string.numeric.parse'
})

app.get('/hello', validator.query(querySchema), (req, res) => {
  res.json({ message: `Hello ${req.query.name}!` })
})
```

### Using Valibot

```js
const v = require('valibot')
const express = require('express')
const { createValidator } = require('express-standard-schema-validation')

const app = express()
const validator = createValidator()

const querySchema = v.object({
  name: v.string(),
  age: v.pipe(
    v.string(),
    v.transform(Number),
    v.number(),
    v.minValue(0)
  )
})

app.get('/hello', validator.query(querySchema), (req, res) => {
  res.json({ message: `Hello ${req.query.name}!` })
})
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
  statusCode: 422
})
```

### Validator Methods

All methods accept a schema and optional configuration that overrides global settings.

#### `validator.query(schema, [options])`

Validates `req.query`. Original value stored in `req.originalQuery`.

```js
app.get('/search', validator.query(searchSchema), handler)
```

#### `validator.body(schema, [options])`

Validates `req.body`. Original value stored in `req.originalBody`.

```js
app.post('/users', validator.body(userSchema), handler)
```

#### `validator.params(schema, [options])`

Validates `req.params`. Original value stored in `req.originalParams`.

**Important:** Must be attached directly to the route:

```js
// ✅ CORRECT
app.get('/users/:id', validator.params(idSchema), handler)

// ❌ INCORRECT - won't work
app.use(validator.params(idSchema))
app.get('/users/:id', handler)
```

#### `validator.headers(schema, [options])`

Validates `req.headers`. Original value stored in `req.originalHeaders`.

```js
app.get('/api', validator.headers(authSchema), handler)
```

#### `validator.fields(schema, [options])`

Validates form fields (for use with `express-formidable`). Original value stored in `req.originalFields`.

```js
app.post('/upload', formidable(), validator.fields(fieldsSchema), handler)
```

#### `validator.response(schema, [options])`

Validates outgoing response data.

```js
app.get('/users/:id', validator.response(userSchema), handler)
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
  extra: Joi.any()
})
  .unknown(true) // Allow extra properties
  .options({
    convert: true, // Type coercion
    abortEarly: false // Return all errors
  })
```

### Zod Configuration

Configure Zod schemas using Zod's built-in methods:

```js
const schema = z
  .object({
    name: z.string(),
    age: z.coerce.number() // Type coercion
  })
  .strict() // Reject extra properties
// .passthrough()         // Allow extra properties
// .strip()               // Remove extra properties (default)
```

### ArkType Configuration

Configure validation directly in ArkType's syntax:

```js
const schema = type({
  name: 'string',
  age: 'string.numeric.parse', // Parse string to number
  score: 'number>0<100' // Number between 0 and 100
})
```

### Valibot Configuration

Configure Valibot schemas using pipes and modifiers:

```js
const schema = v.object({
  name: v.string(),
  age: v.pipe(
    v.string(),
    v.transform(Number),
    v.number()
  )
})
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
const validator = createValidator({ passError: true })

app.get('/hello', validator.query(schema), handler)

app.use((err, req, res, next) => {
  if (err && err.error) {
    return res.status(400).json({
      type: err.type, // 'query', 'body', 'params', 'headers', or 'fields'
      message: err.error.message,
      issues: err.issues // Array of Standard Schema issues
    })
  }
  next(err)
})
```

### TypeScript Error Handling

```ts
import {
  ExpressValidatorError,
  ContainerTypes
} from 'express-standard-schema-validation'

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err && 'type' in err && err.type in ContainerTypes) {
      const validationError = err as ExpressValidatorError
      return res.status(400).json({
        type: validationError.type,
        issues: validationError.issues
      })
    }
    next(err)
  }
)
```

## TypeScript Usage

### Basic TypeScript Example

```ts
import { z } from 'zod'
import express from 'express'
import {
  createValidator,
  ValidatedRequest,
  ValidatedRequestSchema,
  ContainerTypes
} from 'express-standard-schema-validation'

const app = express()
const validator = createValidator()

const querySchema = z.object({
  name: z.string(),
  age: z.coerce.number()
})

interface HelloRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Query]: z.infer<typeof querySchema>
}

app.get(
  '/hello',
  validator.query(querySchema),
  (req: ValidatedRequest<HelloRequestSchema>, res) => {
    // req.query.name is string
    // req.query.age is number
    res.json({ message: `Hello ${req.query.name}!` })
  }
)
```

### Multiple Validations

```ts
const headerSchema = z.object({
  'x-api-key': z.string()
})

const bodySchema = z.object({
  email: z.string().email(),
  age: z.number()
})

interface CreateUserSchema extends ValidatedRequestSchema {
  [ContainerTypes.Headers]: z.infer<typeof headerSchema>
  [ContainerTypes.Body]: z.infer<typeof bodySchema>
}

app.post(
  '/users',
  validator.headers(headerSchema),
  validator.body(bodySchema),
  (req: ValidatedRequest<CreateUserSchema>, res) => {
    // Fully typed access to headers and body
    const apiKey = req.headers['x-api-key']
    const { email, age } = req.body
    res.json({ success: true })
  }
)
```

## Validation Order

Validators execute in the order they're passed to the route:

```js
app.post(
  '/tickets',
  validator.headers(headerSchema), // Validates first
  validator.body(bodySchema), // Validates second
  validator.query(querySchema), // Validates third
  handler
)
```

If any validation fails, subsequent validators and the handler won't execute.

## Original Values

Original (pre-validation) values are preserved:

```js
const schema = z.object({
  age: z.coerce.number()
})

app.get('/test', validator.query(schema), (req, res) => {
  console.log(req.originalQuery.age) // "25" (string)
  console.log(req.query.age) // 25 (number)
})
```

Available original properties:

- `req.originalQuery`
- `req.originalBody`
- `req.originalParams`
- `req.originalHeaders`
- `req.originalFields`

## Examples

Full JavaScript and TypeScript examples are in the [`example/`](./example) directory.

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
