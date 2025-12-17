# Phase 1: Express Standard Schema Package

## 🎯 Objectives

Prepare `express-standard-schema-validation` package for Standard Schema V1 support by:

1. Removing library-specific configuration options
2. Adding comprehensive test coverage for ArkType and Valibot
3. Updating documentation and examples
4. Publishing to npm as v1.0.0

## ⏱️ Time Estimate

**Total:** 2-3 days

- Options removal: 4 hours
- ArkType tests: 4 hours
- Valibot tests: 4 hours
- Documentation: 6 hours
- Review & publish: 2 hours

## 📋 Prerequisites

- [x] Node.js 18+ installed
- [x] Access to npm publish
- [x] Git repository cloned
- [x] Development environment set up

## 🗂️ Files to Modify

### Core Implementation

- `express-standard-schema-validation.js` (245 lines)
- `express-standard-schema-validation.d.ts` (208 lines)

### Tests

- `test.joi.js` (210 lines) - Update if needed
- `test.zod.js` (242 lines) - Update if needed
- `test.arktype.js` (NEW) - ~250 lines
- `test.valibot.js` (NEW) - ~250 lines

### Documentation

- `README.md` - Major update
- `CHANGELOG.md` - Add v1.0.0 entry
- `package.json` - Update metadata

### Examples

- `example/javascript/router-arktype.js` (NEW) - Optional
- `example/javascript/router-valibot.js` (NEW) - Optional

---

## 📝 Step 1: Remove Options System

**Time:** 4 hours

### 1.1 Update Main Implementation File

**File:** `express-standard-schema-validation.js`

#### Remove Container Options (Lines 12-57)

**Before:**

```javascript
const containers = {
  query: {
    storageProperty: 'originalQuery',
    options: {
      convert: true,
      allowUnknown: false,
      abortEarly: false
    }
  },
  body: {
    storageProperty: 'originalBody',
    options: {
      convert: true,
      allowUnknown: false,
      abortEarly: false
    }
  }
  // ... etc
}
```

**After:**

```javascript
/**
 * Container configuration for each request type.
 * Standard Schema validation libraries handle their own configuration
 * through schema definitions, not through middleware options.
 */
const containers = {
  query: {
    storageProperty: 'originalQuery'
  },
  body: {
    storageProperty: 'originalBody'
  },
  headers: {
    storageProperty: 'originalHeaders'
  },
  params: {
    storageProperty: 'originalParams'
  },
  fields: {
    storageProperty: 'originalFields'
  }
}
```

#### Remove Options Merging (Lines 114-146)

**Before:**

```javascript
module.exports.createValidator = function generateValidatorInstance(cfg) {
  cfg = cfg || {}

  // Backward compatibility: map old 'joi' config to 'options'
  if (cfg.joi && !cfg.options) {
    cfg.options = cfg.joi
  }

  const instance = {
    response
  }

  Object.keys(containers).forEach(type => {
    const container = containers[type]

    instance[type] = function(schema, opts) {
      assertStandardSchema(schema)
      opts = opts || {}

      // Backward compatibility: map old 'joi' option to 'options'
      if (opts.joi && !opts.options) {
        opts.options = opts.joi
      }

      const computedOpts = {
        ...container.options,
        ...cfg.options,
        ...opts.options
      }

      return function expressStandardSchemaValidator(req, res, next) {
        Promise.resolve(
          schema['~standard'].validate(req[type], {
            libraryOptions: computedOpts
          })
        )
        // ... rest of function
      }
    }
  })

  return instance
}
```

**After:**

```javascript
/**
 * Creates a validator instance that generates Express middleware for Standard Schema validation
 * @param {object} cfg - Configuration options
 * @param {boolean} cfg.passError - Whether to pass validation errors to Express error handler
 * @param {number} cfg.statusCode - Default status code for validation failures
 * @returns {object} - Validator instance with middleware generator methods
 */
module.exports.createValidator = function generateValidatorInstance(cfg) {
  cfg = cfg || {} // default to an empty config

  // We'll return this instance of the middleware
  const instance = {
    response
  }

  Object.keys(containers).forEach(type => {
    // e.g the "body" or "query" from above
    const container = containers[type]

    instance[type] = function(schema, opts) {
      // Validate that the schema implements Standard Schema
      assertStandardSchema(schema)

      opts = opts || {} // like config, default to empty object

      return function expressStandardSchemaValidator(req, res, next) {
        // Use Standard Schema's validate method with empty libraryOptions
        // Library-specific configuration should be done in the schema itself
        Promise.resolve(
          schema['~standard'].validate(req[type], {
            libraryOptions: {}
          })
        )
          .then(result => {
            if (!result.issues) {
              // Validation succeeded
              req[container.storageProperty] = req[type]
              const descriptor = Object.getOwnPropertyDescriptor(req, type)
              if (descriptor && descriptor.writable) {
                req[type] = result.value
              } else {
                Object.defineProperty(req, type, {
                  get() {
                    return result.value
                  }
                })
              }
              next()
            } else if (opts.passError || cfg.passError) {
              // Pass error to express error handler
              const err = {
                type: type,
                error: {
                  message: buildErrorString(result.issues, `request ${type}`),
                  details: result.issues
                },
                value: req[type],
                issues: result.issues
              }
              next(err)
            } else {
              // Return error as response
              res
                .status(opts.statusCode || cfg.statusCode || 400)
                .end(buildErrorString(result.issues, `request ${type}`))
            }
          })
          .catch(err => {
            // Handle any unexpected errors during validation
            next(err)
          })
      }
    }
  })

  return instance

  function response(schema, opts = {}) {
    assertStandardSchema(schema)

    const type = 'response'
    return (req, res, next) => {
      const resJson = res.json.bind(res)
      res.json = validateJson
      next()

      function validateJson(json) {
        Promise.resolve(
          schema['~standard'].validate(json, {
            libraryOptions: {}
          })
        )
          .then(result => {
            if (!result.issues) {
              // Validation succeeded - return validated value
              return resJson(result.value)
            } else if (opts.passError || cfg.passError) {
              // Pass error to express error handler
              const err = {
                type: type,
                issues: result.issues
              }
              next(err)
            } else {
              // Return error as response
              res
                .status(opts.statusCode || cfg.statusCode || 500)
                .end(buildErrorString(result.issues, `${type} json`))
            }
          })
          .catch(err => {
            // Handle any unexpected errors during validation
            next(err)
          })
      }
    }
  }
}
```

**Key Changes:**

- ✅ Removed `cfg.options` handling
- ✅ Removed `opts.options` handling
- ✅ Removed backward compatibility with `joi` property
- ✅ Pass empty `libraryOptions: {}` to schema validate
- ✅ Kept `passError` and `statusCode` configuration
- ✅ Updated JSDoc comments

### 1.2 Update TypeScript Definitions

**File:** `express-standard-schema-validation.d.ts`

#### Remove Options from Config (Lines 134-154)

**Before:**

```typescript
export interface ExpressValidatorConfig {
  statusCode?: number
  passError?: boolean
  options?: Record<string, unknown>
}
```

**After:**

```typescript
/**
 * Configuration options supported by *createValidator(config)*
 */
export interface ExpressValidatorConfig {
  /**
   * Default status code for validation failures
   */
  statusCode?: number
  /**
   * Whether to pass validation errors to Express error handler
   */
  passError?: boolean
}
```

#### Remove Options from Container Config (Lines 159-176)

**Before:**

```typescript
export interface ExpressValidatorContainerConfig {
  options?: Record<string, unknown>
  statusCode?: number
  passError?: boolean
}
```

**After:**

```typescript
/**
 * Configuration options supported by middleware, e.g *validator.body(config)*
 */
export interface ExpressValidatorContainerConfig {
  /**
   * Status code for validation failure
   */
  statusCode?: number
  /**
   * Whether to pass validation errors to Express error handler
   */
  passError?: boolean
}
```

### 1.3 Verify TypeScript Compilation

```bash
npm run ts-test
```

**Expected output:**

```
✓ TypeScript definitions compile successfully
```

### ✅ Checklist: Step 1

- [ ] Removed container-level options from `containers` object
- [ ] Removed options merging logic from `createValidator`
- [ ] Pass empty `libraryOptions: {}` to validate calls
- [ ] Removed `options` from TypeScript interfaces
- [ ] Updated JSDoc comments
- [ ] Removed Joi backward compatibility code
- [ ] TypeScript compilation passes

---

## 📝 Step 2: Add ArkType Tests

**Time:** 4 hours

### 2.1 Install ArkType

```bash
npm install --save-dev arktype@^2.0.0-beta
```

### 2.2 Create Test File

**File:** `test.arktype.js` (NEW)

```javascript
'use strict'

const { type } = require('arktype')
const supertest = require('supertest')
const expect = require('chai').expect
const chance = require('chance').Chance()

describe('express-standard-schema-validation with ArkType >= 2.0.0', function() {
  let mod

  beforeEach(function() {
    delete require.cache[
      require.resolve('./express-standard-schema-validation')
    ]
    mod = require('./express-standard-schema-validation')
  })

  describe('ArkType Standard Schema Support', function() {
    it('should validate that ArkType schemas implement Standard Schema', function() {
      const arktypeSchema = type({
        key: 'number'
      })

      // Check that ArkType 2.0+ has Standard Schema support
      expect(arktypeSchema).to.have.property('~standard')
      expect(arktypeSchema['~standard']).to.have.property('version', 1)
      expect(arktypeSchema['~standard']).to.have.property('validate')
      expect(arktypeSchema['~standard'].validate).to.be.a('function')
    })
  })

  describe('#query validation', function() {
    it('should successfully validate a query using ArkType', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        name: 'string',
        'age?': 'number'
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.query.name).to.be.a('string')
        if (req.query.age) {
          expect(req.query.age).to.be.a('number')
        }
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?name=John&age=25')
        .expect(200)
        .end(done)
    })

    it('should fail validation with invalid query', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        name: 'string'
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        res.status(200).end('ok')
      })

      supertest(app)
        .get('/test')
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating request query')
          done()
        })
    })
  })

  describe('#body validation', function() {
    it('should successfully validate a body using ArkType', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        username: 'string',
        email: 'string.email'
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        expect(req.body.username).to.be.a('string')
        expect(req.body.email).to.be.a('string')
        res.status(200).json(req.body)
      })

      supertest(app)
        .post('/test')
        .send({ username: 'john', email: 'john@example.com' })
        .expect(200)
        .end(done)
    })

    it('should fail validation with invalid body', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        username: 'string',
        email: 'string.email'
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        res.status(200).end('ok')
      })

      supertest(app)
        .post('/test')
        .send({ username: 'john', email: 'not-an-email' })
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating request body')
          done()
        })
    })
  })

  describe('#params validation', function() {
    it('should successfully validate params using ArkType', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        id: 'string.integer.parse'
      })

      const app = require('express')()
      app.get('/test/:id', validator.params(schema), (req, res) => {
        expect(req.params.id).to.be.a('number')
        res.status(200).json(req.params)
      })

      supertest(app)
        .get('/test/123')
        .expect(200)
        .end(done)
    })

    it('should fail validation with invalid params', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        id: 'string.integer.parse',
        'id>': 0,
        'id<=': 100
      })

      const app = require('express')()
      app.get('/test/:id', validator.params(schema), (req, res) => {
        res.status(200).end('ok')
      })

      supertest(app)
        .get('/test/999')
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating request params')
          done()
        })
    })
  })

  describe('error handling with passError option', function() {
    it('should pass error to express error handler when passError is true', function(done) {
      const validator = mod.createValidator({ passError: true })
      const schema = type({
        key: 'string'
      })
      const app = require('express')()

      app.get('/test', validator.query(schema), (req, res) => {
        res.end('ok')
      })

      app.use((err, req, res, next) => {
        expect(err).to.have.property('type', 'query')
        expect(err).to.have.property('issues')
        expect(err.issues).to.be.an('array')
        expect(err.issues[0]).to.have.property('message')
        res.status(400).json({ error: 'validation failed' })
      })

      supertest(app)
        .get('/test')
        .expect(400)
        .end((err, res) => {
          expect(res.body).to.have.property('error', 'validation failed')
          done()
        })
    })
  })

  describe('ArkType-specific behavior', function() {
    it('should handle type coercion with parse', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        count: 'string.integer.parse'
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.query.count).to.be.a('number')
        expect(req.query.count).to.equal(42)
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?count=42')
        .expect(200)
        .end(done)
    })

    it('should handle union types', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        value: 'string | number'
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?value=hello')
        .expect(200)
        .end(done)
    })
  })
})
```

### 2.3 Run ArkType Tests

```bash
npm run unit -- test.arktype.js
```

**Expected output:**

```
express-standard-schema-validation with ArkType >= 2.0.0
  ✓ ArkType Standard Schema Support
  ✓ #query validation (4 tests)
  ✓ #body validation (2 tests)
  ✓ #params validation (2 tests)
  ✓ error handling with passError option
  ✓ ArkType-specific behavior (2 tests)

11 passing
```

### ✅ Checklist: Step 2

- [ ] ArkType installed as dev dependency
- [ ] `test.arktype.js` created with full test coverage
- [ ] Standard Schema interface tests pass
- [ ] Query validation tests pass
- [ ] Body validation tests pass
- [ ] Params validation tests pass
- [ ] Error handling tests pass
- [ ] ArkType-specific features tested

---

## 📝 Step 3: Add Valibot Tests

**Time:** 4 hours

### 3.1 Install Valibot

```bash
npm install --save-dev valibot@^0.31.0
```

### 3.2 Create Test File

**File:** `test.valibot.js` (NEW)

```javascript
'use strict'

const v = require('valibot')
const supertest = require('supertest')
const expect = require('chai').expect
const chance = require('chance').Chance()

describe('express-standard-schema-validation with Valibot >= 0.31.0', function() {
  let mod

  beforeEach(function() {
    delete require.cache[
      require.resolve('./express-standard-schema-validation')
    ]
    mod = require('./express-standard-schema-validation')
  })

  describe('Valibot Standard Schema Support', function() {
    it('should validate that Valibot schemas implement Standard Schema', function() {
      const valibotSchema = v.object({
        key: v.number()
      })

      // Check that Valibot 0.31+ has Standard Schema support
      expect(valibotSchema).to.have.property('~standard')
      expect(valibotSchema['~standard']).to.have.property('version', 1)
      expect(valibotSchema['~standard']).to.have.property('validate')
      expect(valibotSchema['~standard'].validate).to.be.a('function')
    })
  })

  describe('#query validation', function() {
    it('should successfully validate a query using Valibot', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        name: v.string(),
        age: v.optional(
          v.pipe(
            v.string(),
            v.transform(Number)
          )
        )
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.query.name).to.be.a('string')
        if (req.query.age !== undefined) {
          expect(req.query.age).to.be.a('number')
        }
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?name=John&age=25')
        .expect(200)
        .end(done)
    })

    it('should fail validation with invalid query', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        name: v.string()
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        res.status(200).end('ok')
      })

      supertest(app)
        .get('/test')
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating request query')
          done()
        })
    })
  })

  describe('#body validation', function() {
    it('should successfully validate a body using Valibot', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        username: v.string(),
        email: v.pipe(
          v.string(),
          v.email()
        )
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        expect(req.body.username).to.be.a('string')
        expect(req.body.email).to.be.a('string')
        res.status(200).json(req.body)
      })

      supertest(app)
        .post('/test')
        .send({ username: 'john', email: 'john@example.com' })
        .expect(200)
        .end(done)
    })

    it('should fail validation with invalid body', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        username: v.string(),
        email: v.pipe(
          v.string(),
          v.email()
        )
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        res.status(200).end('ok')
      })

      supertest(app)
        .post('/test')
        .send({ username: 'john', email: 'not-an-email' })
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating request body')
          done()
        })
    })
  })

  describe('#params validation', function() {
    it('should successfully validate params using Valibot', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        id: v.pipe(
          v.string(),
          v.transform(Number)
        )
      })

      const app = require('express')()
      app.get('/test/:id', validator.params(schema), (req, res) => {
        expect(req.params.id).to.be.a('number')
        res.status(200).json(req.params)
      })

      supertest(app)
        .get('/test/123')
        .expect(200)
        .end(done)
    })

    it('should fail validation with invalid params', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        id: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.minValue(1),
          v.maxValue(100)
        )
      })

      const app = require('express')()
      app.get('/test/:id', validator.params(schema), (req, res) => {
        res.status(200).end('ok')
      })

      supertest(app)
        .get('/test/999')
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating request params')
          done()
        })
    })
  })

  describe('error handling with passError option', function() {
    it('should pass error to express error handler when passError is true', function(done) {
      const validator = mod.createValidator({ passError: true })
      const schema = v.object({
        key: v.string()
      })
      const app = require('express')()

      app.get('/test', validator.query(schema), (req, res) => {
        res.end('ok')
      })

      app.use((err, req, res, next) => {
        expect(err).to.have.property('type', 'query')
        expect(err).to.have.property('issues')
        expect(err.issues).to.be.an('array')
        expect(err.issues[0]).to.have.property('message')
        res.status(400).json({ error: 'validation failed' })
      })

      supertest(app)
        .get('/test')
        .expect(400)
        .end((err, res) => {
          expect(res.body).to.have.property('error', 'validation failed')
          done()
        })
    })
  })

  describe('Valibot-specific behavior', function() {
    it('should handle pipe transformations', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        value: v.pipe(
          v.string(),
          v.toUpperCase()
        )
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.query.value).to.equal('HELLO')
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?value=hello')
        .expect(200)
        .end(done)
    })

    it('should handle loose vs strict objects', function(done) {
      const validator = mod.createValidator()
      const schema = v.strictObject({
        name: v.string()
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        res.status(200).json(req.query)
      })

      // strictObject should reject unknown properties
      supertest(app)
        .get('/test?name=John&extra=value')
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating')
          done()
        })
    })

    it('should allow passthrough with looseObject', function(done) {
      const validator = mod.createValidator()
      const schema = v.looseObject({
        name: v.string()
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.query.name).to.equal('John')
        expect(req.query.extra).to.equal('value')
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?name=John&extra=value')
        .expect(200)
        .end(done)
    })
  })
})
```

### 3.3 Run Valibot Tests

```bash
npm run unit -- test.valibot.js
```

**Expected output:**

```
express-standard-schema-validation with Valibot >= 0.31.0
  ✓ Valibot Standard Schema Support
  ✓ #query validation (2 tests)
  ✓ #body validation (2 tests)
  ✓ #params validation (2 tests)
  ✓ error handling with passError option
  ✓ Valibot-specific behavior (3 tests)

12 passing
```

### ✅ Checklist: Step 3

- [ ] Valibot installed as dev dependency
- [ ] `test.valibot.js` created with full test coverage
- [ ] Standard Schema interface tests pass
- [ ] Query validation tests pass
- [ ] Body validation tests pass
- [ ] Params validation tests pass
- [ ] Error handling tests pass
- [ ] Valibot-specific features tested (pipes, strict/loose objects)

---

## 📝 Step 4: Run Full Test Suite

**Time:** 1 hour

### 4.1 Run All Unit Tests

```bash
npm run unit
```

**Expected output:**

```
  express-joi-validation with Joi >= 18.0.0
    ✓ 10 passing

  express-joi-validation with Zod >= 3.23
    ✓ 12 passing

  express-standard-schema-validation with ArkType >= 2.0.0
    ✓ 11 passing

  express-standard-schema-validation with Valibot >= 0.31.0
    ✓ 12 passing

  45 passing (2s)
```

### 4.2 Check Code Coverage

```bash
npm run cover
```

**Expected output:**

```
=============================== Coverage summary ===============================
Statements   : 100% ( 120/120 )
Branches     : 100% ( 42/42 )
Functions    : 100% ( 18/18 )
Lines        : 100% ( 118/118 )
================================================================================
```

### 4.3 Verify TypeScript Compilation

```bash
npm run ts-test
```

### 4.4 Build TypeScript Examples

```bash
npm run build-ts
```

### ✅ Checklist: Step 4

- [ ] All Joi tests pass
- [ ] All Zod tests pass
- [ ] All ArkType tests pass
- [ ] All Valibot tests pass
- [ ] 100% code coverage achieved
- [ ] TypeScript definitions compile
- [ ] TypeScript examples build

---

## 📝 Step 5: Update Documentation

**Time:** 6 hours

### 5.1 Update README.md

**Major sections to update:**

#### Add ArkType to Supported Libraries Section

**Before (lines 61-68):**

```markdown
## Supported Libraries

This module supports validation libraries that implement Standard Schema V1:

- **Joi** v18+ (with Standard Schema support)
- **Zod** v3.23+

Any schema passed to this middleware must have a `~standard` property with `version: 1` and a `validate` function.
```

**After:**

```markdown
## Supported Libraries

This module supports any validation library that implements [Standard Schema V1](https://github.com/standard-schema/standard-schema):

- **Joi** v18.0.0+
- **Zod** v3.23.0+
- **ArkType** v2.0.0-beta+
- **Valibot** v0.31.0+

Any schema passed to this middleware must have a `~standard` property with `version: 1` and a `validate` function.

### Why Standard Schema?

Standard Schema provides a unified interface for validation libraries, allowing you to:

- Use any compatible validation library in your application
- Switch between libraries without changing middleware code
- Mix and match validation libraries in different routes
- Configure validation behavior in schemas, not middleware

All validation configuration (type coercion, unknown properties, error handling, etc.) is done within the schema itself, following each library's best practices.
```

#### Add ArkType and Valibot Usage Examples

Add after the Zod example:

````markdown
### Using ArkType

```js
const { type } = require('arktype')
const app = require('express')()
const validator = require('express-standard-schema-validation').createValidator(
  {}
)

// ArkType uses a concise syntax for defining types
const querySchema = type({
  name: 'string',
  age: 'string.integer.parse' // Type coercion in schema
})

app.get('/orders', validator.query(querySchema), (req, res) => {
  // If we're in here then the query was valid!
  // req.query.age is now a number thanks to .parse
  res.end(`Hello ${req.query.name}, you are ${req.query.age} years old!`)
})
```
````

### Using Valibot

```js
const v = require('valibot')
const app = require('express')()
const validator = require('express-standard-schema-validation').createValidator(
  {}
)

// Valibot uses a pipe-based approach for transformations
const querySchema = v.object({
  name: v.string(),
  age: v.pipe(
    v.string(),
    v.transform(Number)
  ) // Type coercion via pipe
})

app.get('/orders', validator.query(querySchema), (req, res) => {
  // If we're in here then the query was valid!
  // req.query.age is now a number thanks to transform
  res.end(`Hello ${req.query.name}, you are ${req.query.age} years old!`)
})
```

````
#### Update Library Options Section

**Replace the existing "Library Options" section with:**

```markdown
## Library Configuration

### Configuration Philosophy

This middleware does **not** provide configuration options for validation behavior. Instead, all configuration is done within the schema itself, following each library's conventions.

**Why?** The Standard Schema specification intentionally keeps `libraryOptions` as an opaque pass-through. Each library has its own way of configuring validation, and trying to abstract them would:
- Create confusion about what options do what
- Limit access to library-specific features
- Violate the Standard Schema philosophy

### Configuring by Library

#### Joi Configuration

Joi provides an `.options()` method for configuration:

```js
const schema = Joi.object({
  age: Joi.number()
}).options({
  convert: true,        // Enable type coercion
  stripUnknown: true,   // Remove unknown properties
  abortEarly: false    // Return all errors
})
````

#### Zod Configuration

Zod provides methods on schemas for configuration:

```js
const schema = z
  .object({
    age: z.coerce.number() // Type coercion
  })
  .passthrough() // Allow unknown properties
  .strict() // Or reject unknown properties
```

#### ArkType Configuration

ArkType configuration is built into the type definition:

```js
const schema = type({
  age: 'string.integer.parse' // Coercion in type
})
```

#### Valibot Configuration

Valibot uses pipes for transformations and configuration:

```js
const schema = v.object({
  age: v.pipe(
    v.string(),
    v.transform(Number) // Type coercion
  )
})
// Use v.strictObject() or v.looseObject() for unknown property handling
```

````
#### Add Migration Guide Section

Add new section before "API" section:

```markdown
## Migration from express-joi-validation

If you're migrating from `express-joi-validation`, here are the key changes:

### What Changed

1. **Package name:** `express-joi-validation` → `express-standard-schema-validation`
2. **Configuration:** Options removed from middleware; configure in schemas instead
3. **Multi-library:** Now supports Joi, Zod, ArkType, and Valibot

### Migration Steps

#### Step 1: Update Dependencies

```bash
npm uninstall express-joi-validation
npm install express-standard-schema-validation
````

#### Step 2: Update Imports

```js
// Before
const validator = require('express-joi-validation').createValidator({
  passError: true,
  options: { convert: true } // ❌ No longer supported
})

// After
const validator = require('express-standard-schema-validation').createValidator(
  {
    passError: true // ✅ Only passError and statusCode supported
  }
)
```

#### Step 3: Move Options to Schemas

```js
// Before (options in middleware)
const validator = createValidator({
  options: { convert: true, stripUnknown: true }
})
const schema = Joi.object({ age: Joi.number() })

// After (options in schema)
const validator = createValidator()
const schema = Joi.object({
  age: Joi.number()
}).options({
  convert: true,
  stripUnknown: true
})
```

### No Breaking Changes for Simple Use Cases

If you didn't use custom options, your code should work as-is:

```js
// This works before and after migration ✅
const validator = createValidator()
const schema = Joi.object({
  name: Joi.string().required()
})
app.get('/users', validator.query(schema), handler)
```

````
### 5.2 Update CHANGELOG.md

Add at the top:

```markdown
## 1.0.0 (DD/MM/YYYY)

### Breaking Changes
* **Options System Removed**: Library-specific options (`convert`, `allowUnknown`, etc.) removed from middleware configuration. All validation behavior must now be configured in schemas themselves.
* **API Simplification**: `createValidator()` now only accepts `statusCode` and `passError` options
* **Package Name Fix**: Corrected duplicate "validation" in package name

### New Features
* **ArkType Support**: Full support for ArkType v2.0.0+ with comprehensive test coverage
* **Valibot Support**: Full support for Valibot v0.31.0+ with comprehensive test coverage
* **Multi-Library Testing**: Test suite now covers Joi, Zod, ArkType, and Valibot
* **Standard Schema V1**: True implementation of Standard Schema specification
* **Improved Documentation**: Added examples for all supported libraries with configuration guides

### Migration
* **From express-joi-validation**: See Migration Guide in README
* **Schema Configuration**: Move any middleware options to schema definitions
* **TypeScript**: Updated type definitions remove `options` parameter

### Why These Changes?

The options system was Joi-specific and didn't align with the Standard Schema philosophy. Each validation library has its own way of configuring behavior, and the Standard Schema specification intentionally keeps `libraryOptions` as an opaque pass-through. By removing the options abstraction, we:
- Align with Standard Schema V1 specification
- Eliminate library-specific code from middleware
- Provide clearer, more library-native APIs
- Enable better IDE autocomplete and type checking
- Reduce confusion about which options apply to which libraries

### Supported Versions
* Node.js >= 18.0.0
* Joi >= 18.0.0
* Zod >= 3.23.0
* ArkType >= 2.0.0-beta
* Valibot >= 0.31.0
````

### 5.3 Update package.json

```json
{
  "name": "express-standard-schema-validation",
  "version": "1.0.0",
  "description": "Express middleware for validating requests using Standard Schema V1 compatible libraries (Joi, Zod, ArkType, Valibot)",
  "keywords": [
    "standard-schema",
    "joi",
    "zod",
    "arktype",
    "valibot",
    "express",
    "validation",
    "middleware",
    "typescript"
  ],
  "devDependencies": {
    "@types/express": "~4.0.39",
    "@types/express-formidable": "~1.0.4",
    "@types/node": "^18.19.68",
    "@types/qs": "~6.9.3",
    "arktype": "^2.0.0-beta",
    "body-parser": "1.20.3",
    "chai": "~3.5.0",
    "chance": "^1.1.12",
    "clear-require": "~2.0.0",
    "coveralls": "~3.0.2",
    "express": "~4.17.3",
    "express-formidable": "~1.0.0",
    "husky": "~1.0.1",
    "joi": "~18.0.2",
    "lint-staged": "~8.2.1",
    "lodash": "~4.17.15",
    "mocha": "~8.1.3",
    "mocha-lcov-reporter": "~1.3.0",
    "nodemon": "~2.0.4",
    "nyc": "~15.1.0",
    "prettier": "~1.14.3",
    "proxyquire": "~1.7.11",
    "qs": "~6.9.4",
    "sinon": "~1.17.7",
    "supertest": "~3.0.0",
    "typescript": "^5.7.2",
    "valibot": "^0.31.0",
    "zod": "^3.23.0"
  },
  "peerDependencies": {
    "joi": ">=18.0.0",
    "zod": ">=3.23.0",
    "arktype": ">=2.0.0-beta",
    "valibot": ">=0.31.0"
  },
  "peerDependenciesMeta": {
    "joi": {
      "optional": true
    },
    "zod": {
      "optional": true
    },
    "arktype": {
      "optional": true
    },
    "valibot": {
      "optional": true
    }
  }
}
```

### ✅ Checklist: Step 5

- [ ] README updated with ArkType and Valibot
- [ ] Migration guide added to README
- [ ] Library configuration section rewritten
- [ ] CHANGELOG updated with v1.0.0 entry
- [ ] package.json version bumped to 1.0.0
- [ ] package.json keywords updated
- [ ] package.json peer dependencies added
- [ ] All four libraries documented equally

---

## 📝 Step 6: Publish to npm

**Time:** 2 hours

### 6.1 Pre-Publish Checklist

Run through the complete checklist:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Run all tests
npm test

# Verify coverage
npm run cover

# Check TypeScript
npm run ts-test

# Build examples
npm run build-ts

# Test examples manually (optional)
npm run example
```

### 6.2 Version Verification

```bash
# Check current version
npm version

# Verify package.json
cat package.json | grep version
```

Should show: `"version": "1.0.0"`

### 6.3 Git Commit and Tag

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Release v1.0.0: Standard Schema support with ArkType and Valibot

- Remove library-specific options system
- Add full support for ArkType and Valibot
- Update documentation with all four libraries
- Simplify API to Standard Schema philosophy
- 100% test coverage maintained"

# Create git tag
git tag v1.0.0

# Push to remote
git push origin main
git push origin v1.0.0
```

### 6.4 npm Publish

```bash
# Dry run first
npm publish --dry-run

# Review output, then publish
npm publish
```

### 6.5 Verify Publication

```bash
# Check on npm
npm view express-standard-schema-validation

# Test installation
mkdir /tmp/test-install
cd /tmp/test-install
npm init -y
npm install express-standard-schema-validation joi zod
node -e "console.log(require('express-standard-schema-validation'))"
```

### ✅ Checklist: Step 6

- [ ] All tests passing
- [ ] 100% coverage verified
- [ ] Version bumped to 1.0.0
- [ ] Git commit created
- [ ] Git tag created
- [ ] Changes pushed to GitHub
- [ ] npm publish successful
- [ ] Package visible on npm
- [ ] Installation verified

---

## 🎉 Phase 1 Complete!

### Summary of Achievements

✅ **Options System Removed**

- Cleaned up Joi-specific configuration
- Simplified API to Standard Schema philosophy
- All configuration now in schemas

✅ **Multi-Library Support**

- Full support for Joi 18+
- Full support for Zod 3.23+
- Full support for ArkType 2.0+
- Full support for Valibot 0.31+

✅ **Comprehensive Testing**

- 45+ unit tests across all libraries
- 100% code coverage maintained
- TypeScript definitions verified

✅ **Documentation**

- README updated with all four libraries
- Migration guide created
- Configuration examples for each library
- CHANGELOG with detailed v1.0.0 notes

✅ **Published**

- Package published to npm as v1.0.0
- Available for installation
- Ready for Phase 2 integration

### Metrics

- **Tests:** 45 passing
- **Coverage:** 100%
- **Libraries Supported:** 4
- **Documentation Pages:** 3 (README, CHANGELOG, TypeScript definitions)
- **Time Taken:** ~2-3 days

### What's Next?

Proceed to **[Phase 2: REST API Migration](./PHASE_2_REST_API_MIGRATION.md)** to integrate this package into `@pella/rest-api`.

---

## 🐛 Troubleshooting

### Issue: ArkType tests failing

**Symptom:** `Cannot find module 'arktype'`

**Solution:**

```bash
npm install --save-dev arktype@^2.0.0-beta
```

### Issue: Valibot tests failing

**Symptom:** `Cannot find module 'valibot'`

**Solution:**

```bash
npm install --save-dev valibot@^0.31.0
```

### Issue: Coverage below 100%

**Symptom:** Coverage check fails

**Solution:**

1. Run `npm run cover` to see uncovered lines
2. Add tests for uncovered branches
3. Common areas: error paths, edge cases

### Issue: TypeScript compilation errors

**Symptom:** `npm run ts-test` fails

**Solution:**

1. Check type definition syntax
2. Ensure all exports are typed
3. Run `tsc --noEmit` for detailed errors

### Issue: npm publish fails with 401

**Symptom:** `npm ERR! code E401`

**Solution:**

```bash
npm login
npm whoami  # Verify logged in
npm publish
```

### Issue: Package name already taken

**Symptom:** `npm ERR! 403 Forbidden`

**Solution:**

- Use scoped package: `@yourorg/express-standard-schema-validation`
- Or choose different name

---

## 📞 Getting Help

If you encounter issues not covered here:

1. Check existing GitHub issues
2. Review Standard Schema specification
3. Test with minimal reproduction
4. Ask in team Slack channel
5. Create GitHub issue with details

---

**Phase 1 Document Version:** 1.0.0  
**Last Updated:** DD/MM/YYYY  
**Next Phase:** [Phase 2: REST API Migration](./PHASE_2_REST_API_MIGRATION.md)
