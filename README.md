# express-standard-schema-validation

This middleware started as a fork of [express-joi-validation](https://github.com/evanshortiss/express-joi-validation.git)

It is a WIP

A middleware for validating express inputs using [Standard Schema V1](https://github.com/standard-schema/standard-schema) compatible validation libraries. Supports **Joi** and **Zod**.

Features include:

- TypeScript support.
- Works with multiple validation libraries through Standard Schema V1 interface.
- Specify the order in which request inputs are validated.
- Replaces the incoming `req.body`, `req.query`, etc with the validated result.
- Retains the original `req.body` inside a new property named `req.originalBody`.
  The same applies for headers, query, and params using the `original` prefix,
  e.g `req.originalQuery`.
- Sensible default validation options.

## Quick Links

- [Install](#install)
- [Supported Libraries](#supported-libraries)
- [API](#api)
- [Usage (JavaScript)](#usage-javascript)
  - [Using Joi](#using-joi)
  - [Using Zod](#using-zod)
- [Usage (TypeScript)](#usage-typescript)
- [Behaviours](#behaviours)
  - [Validation Ordering](#validation-ordering)
  - [Error Handling](#error-handling)
  - [Library Options](#library-options)
  - [Custom Express Error Handler](#custom-express-error-handler)

## Install

```bash
npm i express-standard-validation
```

Then install your preferred validation library:

```bash
# For Joi
npm i joi

# For Zod
npm i zod
```

Then install your preferred validation library:

```bash
# For Joi
npm i joi

# For Zod
npm i zod
```

## Supported Libraries

This module supports validation libraries that implement [Standard Schema V1](https://github.com/standard-schema/standard-schema):

- **Joi** v18+ (with Standard Schema support)
- **Zod** v3.23+

Any schema passed to this middleware must have a `~standard` property with `version: 1` and a `validate` function.

## Example

A JavaScript and TypeScript example can be found in the `example/` folder of
this repository.

## Usage (JavaScript)

### Using Joi

```js
const Joi = require('joi')
const app = require('express')()
const validator = require('express-joi-validation').createValidator({})

const querySchema = Joi.object({
  name: Joi.string().required()
})

app.get('/orders', validator.query(querySchema), (req, res) => {
  // If we're in here then the query was valid!
  res.end(`Hello ${req.query.name}!`)
})
```

### Using Zod

```js
const { z } = require('zod')
const app = require('express')()
const validator = require('express-joi-validation').createValidator({})

const querySchema = z.object({
  name: z.string()
})

app.get('/orders', validator.query(querySchema), (req, res) => {
  res.end(`Hello ${req.query.name}!`)
})
```

You can minimise some duplication by using [joi-extract-type](https://github.com/TCMiranda/joi-extract-type/).

_NOTE: this does not work with Joi v16+ at the moment. See [this issue](https://github.com/TCMiranda/joi-extract-type/issues/23)._

```ts
import * as Joi from 'joi'
import * as express from 'express'
import {
  // Use this as a replacement for express.Request
  ValidatedRequest,
  // Extend from this to define a valid schema type/interface
  ValidatedRequestSchema,
  // Creates a validator that generates middlewares
  createValidator
} from 'express-joi-validation'

// This is optional, but without it you need to manually generate
// a type or interface for ValidatedRequestSchema members
import 'joi-extract-type'

const app = express()
const validator = createValidator()

const querySchema = Joi.object({
  name: Joi.string().required()
})

interface HelloRequestSchema extends ValidatedRequestSchema {
  [ContainerTypes.Query]: Joi.extractType<typeof querySchema>

  // Without Joi.extractType you would do this:
  // query: {
  //   name: string
  // }
}

app.get(
  '/hello',
  validator.query(querySchema),
  (req: ValidatedRequest<HelloRequestSchema>, res) => {
    // Woohoo, type safety and intellisense for req.query!
    res.end(`Hello ${req.query.name}!`)
  }
)
```

## API

### Structure

- module (express-joi-validation)
  - [createValidator(config)](#createvalidatorconfig)
    - [query(options)](#validatorqueryschema-options)
    - [body(options)](#validatorbodyschema-options)
    - [headers(options)](#validatorheadersschema-options)
    - [params(options)](#validatorparamsschema-options)
    - [response(options)](#validatorresponseschema-options)
    - [fields(options)](#validatorfieldsschema-options)

### createValidator(config)

Creates a validator. Supports the following options:

- passError (default: `false`) - Passes validation errors to the express error
  hander using `next(err)` when `true`
- statusCode (default: `400`) - The status code used when validation fails and
  `passError` is `false`.

#### validator.query(schema, [options])

Creates a middleware instance that will validate the `req.query` for an
incoming request. Can be passed `options` that override the config passed
when the validator was created.

Supported options are:

- libraryOptions - Custom options to pass to the validation library.
- passError - Same as above.
- statusCode - Same as above.

**Note:** The `libraryOptions` are passed directly to the schema's validation function.
Different libraries handle these options differently. For example, Joi uses options like
`convert`, `allowUnknown`, while Zod ignores most options since they're configured on the
schema itself.

#### validator.body(schema, [options])

Creates a middleware instance that will validate the `req.body` for an incoming
request. Can be passed `options` that override the options passed when the
validator was created.

Supported options are the same as `validator.query`.

#### validator.headers(schema, [options])

Creates a middleware instance that will validate the `req.headers` for an
incoming request. Can be passed `options` that override the options passed
when the validator was created.

Supported options are the same as `validator.query`.

#### validator.params(schema, [options])

Creates a middleware instance that will validate the `req.params` for an
incoming request. Can be passed `options` that override the options passed
when the validator was created.

Supported options are the same as `validator.query`.

#### validator.response(schema, [options])

Creates a middleware instance that will validate the outgoing response.
Can be passed `options` that override the options passed when the instance was
created.

Supported options are the same as `validator.query`.

#### validator.fields(schema, [options])

Creates a middleware instance that will validate the fields for an incoming
request. This is designed for use with `express-formidable`. Can be passed
`options` that override the options passed when the validator was created.

The `instance.params` middleware is a little different to the others. It _must_
be attached directly to the route it is related to. Here's a sample:

```js
const schema = Joi.object({
  id: Joi.number()
    .integer()
    .required()
})

// INCORRECT
app.use(validator.params(schema))
app.get('/orders/:id', (req, res, next) => {
  // The "id" parameter will NOT have been validated here!
})

// CORRECT
app.get('/orders/:id', validator.params(schema), (req, res, next) => {
  // This WILL have a validated "id"
})
```

Supported options are the same as `validator.query`.

## Behaviours

### Validation Ordering

Validation can be performed in a specific order using standard express
middleware behaviour. Pass the middleware in the desired order.

Here's an example where the order is headers, body, query:

```js
route.get(
  '/tickets',
  validator.headers(headerSchema),
  validator.body(bodySchema),
  validator.query(querySchema),
  routeHandler
)
```

### Error Handling

When validation fails, this module will default to returning a HTTP 400 with
the validation error as a `text/plain` response type.

A `passError` option is supported to override this behaviour. This option
forces the middleware to pass the error to the express error handler using the
standard `next` function behaviour.

See the [Custom Express Error Handler](#custom-express-error-handler) section
for an example.

### Library Options

It is possible to pass library-specific options to each validator like so:

```js
route.get(
  '/tickets',
  validator.headers(headerSchema, {
    libraryOptions: { convert: true, allowUnknown: true }
  }),
  validator.body(bodySchema, {
    libraryOptions: { convert: true, allowUnknown: false }
  }),
  routeHandler
)
```

**Note:** Different validation libraries handle options differently:

- **Joi**: Options like `convert`, `allowUnknown`, `stripUnknown`, `abortEarly` are passed to `Joi.validate()`. However, with Standard Schema, it's recommended to configure these on the schema itself using `.unknown()`, `.options()`, etc.
- **Zod**: Most validation behavior is configured on the schema itself (e.g., `.strict()`, `.passthrough()`). Library options are generally ignored.

The following sensible defaults are applied if none are passed (primarily for Joi compatibility):

#### Query

- convert: true
- allowUnknown: false
- abortEarly: false

### Joi to Zod Migration Reference

The following table shows how common Joi validation options map to Zod configurations:

| Joi Option            | Purpose                            | Zod Equivalent           |
| --------------------- | ---------------------------------- | ------------------------ |
| `convert: true`       | Coerce types (e.g., `"25"` → `25`) | `z.coerce.number()`      |
| `allowUnknown: true`  | Allow extra properties             | `.passthrough()`         |
| `allowUnknown: false` | Reject extra properties            | `.strict()`              |
| `stripUnknown: true`  | Remove extra properties            | Default behavior         |
| `stripUnknown: false` | Keep extra properties              | `.passthrough()`         |
| `abortEarly: true`    | Stop at first error                | N/A (always returns all) |
| `abortEarly: false`   | Return all errors                  | Default behavior         |

**Examples:**

```js
// Joi: Convert string to number
Joi.number() // with { convert: true } option

// Zod: Coerce string to number
z.coerce.number()

// Joi: Allow unknown fields
Joi.object({ name: Joi.string() }).unknown(true)

// Zod: Allow unknown fields
z.object({ name: z.string() }).passthrough()

// Joi: Reject unknown fields (throw error)
Joi.object({ name: Joi.string() }) // with { allowUnknown: false }

// Zod: Reject unknown fields (throw error)
z.object({ name: z.string() }).strict()

// Joi: Strip unknown fields (default with allowUnknown: false)
Joi.object({ name: Joi.string() }).options({ stripUnknown: true })

// Zod: Strip unknown fields (default behavior)
z.object({ name: z.string() })
```

**Important Note:** With Standard Schema, Joi options should be configured on the schema itself (using `.unknown()`, `.options()`, etc.) rather than passed at validation time. This aligns with how Zod works and makes migrations easier.

#### Query

- convert: true
- allowUnknown: false
- abortEarly: false

#### Body

- convert: true
- allowUnknown: false
- abortEarly: false

#### Headers

- convert: true
- allowUnknown: true
- stripUnknown: false
- abortEarly: false

#### Route Params

- convert: true
- allowUnknown: false
- abortEarly: false

#### Fields (with express-formidable)

- convert: true
- allowUnknown: false
- abortEarly: false

## Custom Express Error Handler

```js
const validator = require('express-joi-validation').createValidator({
  // This options forces validation to pass any errors the express
  // error handler instead of generating a 400 error
  passError: true
})

const app = require('express')()
const orders = require('lib/orders')

app.get(
  '/orders',
  validator.query(require('./query-schema')),
  (req, res, next) => {
    // if we're in here then the query was valid!
    orders
      .getForQuery(req.query)
      .then(listOfOrders => res.json(listOfOrders))
      .catch(next)
  }
)

// After your routes add a standard express error handler. This will be passed the
// validation error, plus an extra "type" field so we can tell what type of validation failed
app.use((err, req, res, next) => {
  if (err && err.error) {
    // we had a validation error, let's return a custom 400 json response
    res.status(400).json({
      type: err.type, // will be "query" here, but could be "headers", "body", or "params"
      message: err.error.toString()
    })
  } else {
    // pass on to another error handler
    next(err)
  }
})
```

In TypeScript environments `err.type` can be verified against the exported
`ContainerTypes`:

```ts
import { ContainerTypes } from 'express-joi-validation'

app.use(
  (
    err: any | ExpressJoiError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // ContainerTypes is an enum exported by this module. It contains strings
    // such as "body", "headers", "query"...
    if (err && 'type' in err && err.type in ContainerTypes) {
      const e: ExpressJoiError = err
      // e.g "You submitted a bad query paramater"
      res.status(400).end(`You submitted a bad ${e.type} paramater`)
    } else {
      res.status(500).end('internal server error')
    }
    w
  }
)
```
