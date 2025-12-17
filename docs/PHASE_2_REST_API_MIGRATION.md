# Phase 2: REST API Migration

## 🎯 Objectives

Migrate `@pella/rest-api` from `express-joi-validation` to `express-standard-schema-validation` by:

1. Updating dependencies and package metadata
2. Replacing validation middleware implementation
3. Updating error handling for Standard Schema format
4. Updating tests and examples
5. Creating migration documentation

## ⏱️ Time Estimate

**Total:** 2-3 days

- Dependency updates: 1 hour
- Code updates: 4 hours
- Test updates: 6 hours
- Example updates: 4 hours
- Documentation: 5 hours

## 📋 Prerequisites

- [x] Phase 1 complete (`express-standard-schema-validation@1.0.0` published)
- [x] `@pella/rest-api` repository cloned
- [x] Node.js 18+ installed
- [x] All current tests passing

## 🗂️ Files to Modify

### Dependencies

- `package.json` - Update dependencies and version

### Source Code

- `src/controllers.js` - Update import
- `src/validation.js` - Update error handling
- `src/middlewares.js` - Update function name

### Tests

- `test/validation.test.js` - Add Standard Schema tests
- `test/middlewares.test.js` - Update function references
- `test/controllers/**/*.test.js` - Update as needed

### Examples

- `examples/controllers/**/*.js` - Add schema configuration

### Documentation

- `README.md` - Update validation section
- `MIGRATION.md` (NEW) - Create migration guide
- `CHANGELOG.md` - Add v5.0.0 entry

---

## 📝 Step 1: Update Dependencies

**Time:** 1 hour

### 1.1 Update package.json

**File:** `package.json`

**Changes:**

```json
{
  "name": "@pella/rest-api",
  "version": "5.0.0",
  "description": "REST API with conventions for Pella",
  "dependencies": {
    "@pella/logger": "4.4.13",
    "@pella/nodejs-framework": "2.0.2",
    "correlation-id": "5.2.0",
    "express": "5.2.0",
    "express-standard-schema-validation": "^1.0.0",
    "globby": "15.0.0",
    "jsonwebtoken": "9.0.2"
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
  },
  "devDependencies": {
    "@vitest/coverage-istanbul": "4.0.15",
    "arktype": "^2.0.0-beta",
    "chance": "1.1.13",
    "eslint": "8.57.1",
    "eslint-config-get-off-my-lawn": "7.2.0",
    "eslint-plugin-vitest-globals": "1.5.0",
    "joi": "^18.0.2",
    "valibot": "^0.31.0",
    "vitest": "4.0.15",
    "zod": "^3.23.0"
  }
}
```

**Key changes:**

- ✅ Version: `4.0.0` → `5.0.0`
- ✅ Removed: `express-joi-validation`
- ✅ Added: `express-standard-schema-validation@^1.0.0`
- ✅ Updated: Zod peer dependency to `>=3.23.0`
- ✅ Added: ArkType and Valibot to peer dependencies
- ✅ Added: ArkType, Valibot, Joi, and Zod to devDependencies for testing

### 1.2 Install Dependencies

```bash
cd /Users/derr/git/rest-api
rm -rf node_modules package-lock.json
npm install
```

**Expected output:**

```
added 245 packages
audited 246 packages
found 0 vulnerabilities
```

### 1.3 Verify Installation

```bash
npm list express-standard-schema-validation
npm list joi
npm list zod
npm list arktype
npm list valibot
```

### ✅ Checklist: Step 1

- [ ] package.json version updated to 5.0.0
- [ ] express-joi-validation removed
- [ ] express-standard-schema-validation added
- [ ] Peer dependencies updated
- [ ] Dev dependencies added for all validation libraries
- [ ] npm install successful
- [ ] All dependencies verified

---

## 📝 Step 2: Update Source Code

**Time:** 4 hours

### 2.1 Update src/controllers.js

**File:** `src/controllers.js`

**Before (line 2):**

```javascript
import { createValidator } from 'express-joi-validation'
```

**After:**

```javascript
import { createValidator } from 'express-standard-schema-validation'
```

**That's it!** The `getValidators` function (lines 11-27) remains unchanged because the API is identical.

### 2.2 Update src/validation.js

**File:** `src/validation.js`

**Complete rewrite:**

```javascript
import { BAD_REQUEST } from './enums/status-codes.js'

/**
 * Catches validation errors from express-standard-schema-validation middleware.
 * Supports any validation library implementing Standard Schema V1 (Joi, Zod, ArkType, Valibot).
 *
 * @param {Object} error - Error object from validation middleware
 * @param {string} error.type - Type of validation (body, query, params, headers, fields)
 * @param {Array} error.issues - Array of Standard Schema validation issues
 * @param {Object} request - Express request object
 * @param {Object} response - Express response object
 * @param {Function} next - Express next middleware function
 */
export const catchValidationErrors = (error, request, response, next) => {
  // Check for Standard Schema validation error
  if (error && error.issues && Array.isArray(error.issues)) {
    // Build error message from issues array
    const issueMessages = error.issues.map(issue => issue.message).join('. ')

    response.status(BAD_REQUEST).json({
      message: `Error validating request ${error.type}. ${issueMessages}`,
      type: error.type,
      issues: error.issues
    })

    return
  }

  // Backward compatibility: Check for legacy Joi error format
  if (error && error.error && error.error.isJoi) {
    response.status(BAD_REQUEST).json({
      message: error.error.toString(),
      type: error.type
    })

    return
  }

  // Not a validation error - pass to next error handler
  // eslint-disable-next-line node/callback-return
  next(error)
}

/**
 * Alias for backward compatibility.
 * @deprecated Use catchValidationErrors instead
 */
export const catchJoiValidationErrors = catchValidationErrors
```

**Key changes:**

- ✅ Primary logic handles Standard Schema `issues` array
- ✅ Backward compatibility with old Joi `isJoi` flag
- ✅ Comprehensive JSDoc
- ✅ Error message includes all validation issues
- ✅ Returns structured error with `issues` array
- ✅ Alias `catchJoiValidationErrors` for compatibility

### 2.3 Update src/middlewares.js

**File:** `src/middlewares.js`

**Before:**

```javascript
import express from 'express'

import { catchJoiValidationErrors } from './validation.js'

const enableParsingOfRequestBodyAsJSON = (app, { payloadLimit = '1mb' }) =>
  app.use(express.json({ limit: payloadLimit }))
const catchValidationErrors = app => app.use(catchJoiValidationErrors)

export { catchValidationErrors, enableParsingOfRequestBodyAsJSON }
```

**After:**

```javascript
import express from 'express'

import { catchValidationErrors as catchValidationErrorsMiddleware } from './validation.js'

/**
 * Enables parsing of request body as JSON with configurable payload limit
 * @param {Object} app - Express application instance
 * @param {Object} options - Configuration options
 * @param {string} options.payloadLimit - Maximum payload size (default: '1mb')
 */
const enableParsingOfRequestBodyAsJSON = (app, { payloadLimit = '1mb' }) =>
  app.use(express.json({ limit: payloadLimit }))

/**
 * Registers validation error handler middleware.
 * Handles errors from any Standard Schema V1 compatible validation library.
 * @param {Object} app - Express application instance
 */
const registerValidationErrorHandler = app =>
  app.use(catchValidationErrorsMiddleware)

/**
 * @deprecated Use registerValidationErrorHandler instead
 */
const catchValidationErrors = registerValidationErrorHandler

export {
  catchValidationErrors, // Backward compatibility
  registerValidationErrorHandler,
  enableParsingOfRequestBodyAsJSON
}
```

**Key changes:**

- ✅ Import renamed to avoid conflict
- ✅ New function `registerValidationErrorHandler` (clearer name)
- ✅ Keep `catchValidationErrors` as alias for backward compatibility
- ✅ Added JSDoc for all functions
- ✅ Export both names for smooth migration

### 2.4 Verify Code Changes

```bash
npm run lint
```

**Expected output:**

```
✓ No linting errors
```

### ✅ Checklist: Step 2

- [ ] controllers.js import updated
- [ ] validation.js rewritten with Standard Schema support
- [ ] validation.js includes backward compatibility
- [ ] middlewares.js updated with new function name
- [ ] middlewares.js exports both old and new names
- [ ] JSDoc added to all functions
- [ ] Linting passes

---

## 📝 Step 3: Update Tests

**Time:** 6 hours

### 3.1 Update test/validation.test.js

**File:** `test/validation.test.js`

**Complete rewrite:**

```javascript
import { catchValidationErrors } from '../src/validation.js'

describe('validation', () => {
  let request, response, next, json, status

  beforeEach(() => {
    next = vi.fn()
    json = vi.fn()
    status = vi.fn().mockReturnValue({ json })
    response = { status }
    request = {}
  })

  describe('Standard Schema validation errors', () => {
    test('should handle Standard Schema issues array', () => {
      const error = {
        type: 'body',
        issues: [
          { message: '"id" is required' },
          { message: '"type" must be a string' }
        ]
      }

      catchValidationErrors(error, request, response, next)

      expect(status).toHaveBeenCalledTimes(1)
      expect(status).toHaveBeenCalledWith(400)

      expect(json).toHaveBeenCalledTimes(1)
      expect(json).toHaveBeenCalledWith({
        message:
          'Error validating request body. "id" is required. "type" must be a string',
        type: 'body',
        issues: error.issues
      })

      expect(next).toHaveBeenCalledTimes(0)
    })

    test('should handle single issue', () => {
      const error = {
        type: 'query',
        issues: [{ message: '"name" is required' }]
      }

      catchValidationErrors(error, request, response, next)

      expect(json).toHaveBeenCalledWith({
        message: 'Error validating request query. "name" is required',
        type: 'query',
        issues: error.issues
      })
    })

    test('should handle issues from different validation libraries', () => {
      // Zod-style error
      const zodError = {
        type: 'body',
        issues: [
          {
            message: 'Invalid email',
            path: ['email']
          }
        ]
      }

      catchValidationErrors(zodError, request, response, next)

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith({
        message: 'Error validating request body. Invalid email',
        type: 'body',
        issues: zodError.issues
      })
    })

    test('should not call next when handling validation error', () => {
      const error = {
        type: 'params',
        issues: [{ message: 'Validation failed' }]
      }

      catchValidationErrors(error, request, response, next)

      expect(next).toHaveBeenCalledTimes(0)
    })
  })

  describe('Backward compatibility with Joi errors', () => {
    test('should handle legacy Joi error format', () => {
      const error = {
        error: {
          isJoi: true,
          toString: () => 'ValidationError: "id" is required'
        },
        type: 'body'
      }

      catchValidationErrors(error, request, response, next)

      expect(status).toHaveBeenCalledWith(400)
      expect(json).toHaveBeenCalledWith({
        message: 'ValidationError: "id" is required',
        type: 'body'
      })
      expect(next).toHaveBeenCalledTimes(0)
    })

    test('should not call next for Joi errors', () => {
      const error = {
        error: {
          isJoi: true,
          toString: () => 'Error'
        },
        type: 'query'
      }

      catchValidationErrors(error, request, response, next)

      expect(next).toHaveBeenCalledTimes(0)
    })
  })

  describe('Non-validation errors', () => {
    test('should call next if there is no error', () => {
      const error = null

      catchValidationErrors(error, request, response, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith(null)
    })

    test('should call next if error has no issues', () => {
      const error = { type: 'body' }

      catchValidationErrors(error, request, response, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith(error)
    })

    test('should call next if error is not validation related', () => {
      const error = new Error('Database connection failed')

      catchValidationErrors(error, request, response, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith(error)
    })

    test('should call next if issues is not an array', () => {
      const error = {
        type: 'body',
        issues: 'not an array'
      }

      catchValidationErrors(error, request, response, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('Error response format', () => {
    test('should include all validation issues in response', () => {
      const error = {
        type: 'body',
        issues: [
          { message: 'Error 1' },
          { message: 'Error 2' },
          { message: 'Error 3' }
        ]
      }

      catchValidationErrors(error, request, response, next)

      const responseBody = json.mock.calls[0][0]
      expect(responseBody.message).toContain('Error 1')
      expect(responseBody.message).toContain('Error 2')
      expect(responseBody.message).toContain('Error 3')
      expect(responseBody.issues).toHaveLength(3)
    })

    test('should always return 400 status code', () => {
      const types = ['body', 'query', 'params', 'headers', 'fields']

      types.forEach(type => {
        status.mockClear()
        const error = {
          type,
          issues: [{ message: 'Error' }]
        }

        catchValidationErrors(error, request, response, next)

        expect(status).toHaveBeenCalledWith(400)
      })
    })
  })
})
```

**Key additions:**

- ✅ Comprehensive Standard Schema error tests
- ✅ Backward compatibility tests for Joi
- ✅ Non-validation error passthrough tests
- ✅ Response format validation tests
- ✅ Multiple validation library format tests

### 3.2 Update test/middlewares.test.js

**File:** `test/middlewares.test.js`

Update any references to `catchJoiValidationErrors` → `catchValidationErrors` or `registerValidationErrorHandler`.

### 3.3 Update Controller Tests

**Example:** `test/controllers/windows/post.test.js`

Add new test section for Standard Schema validation:

```javascript
describe('schemas with multiple libraries', () => {
  describe('Joi schemas', () => {
    test('should have Standard Schema support', () => {
      expect(schemas.body).toHaveProperty('~standard')
      expect(schemas.body['~standard']).toHaveProperty('version', 1)
    })

    // Existing Joi tests...
  })

  describe('Zod schemas', () => {
    test('should validate with Zod schema alternative', async () => {
      const { z } = await import('zod')

      const zodSchema = {
        body: z.object({
          id: z.string().uuid(),
          type: z.string()
        }),
        headers: z.object({
          'x-correlation-id': z.string().uuid()
        })
      }

      // Verify Standard Schema support
      expect(zodSchema.body).toHaveProperty('~standard')

      const validBody = {
        id: chance.guid(),
        type: chance.string()
      }

      const result = zodSchema.body['~standard'].validate(validBody)
      expect(result.issues).toBeUndefined()
      expect(result.value).toStrictEqual(validBody)
    })
  })
})
```

### 3.4 Run Test Suite

```bash
npm run coverage
```

**Expected output:**

```
PASS test/validation.test.js
PASS test/middlewares.test.js
PASS test/controllers/windows/post.test.js
...

Test Suites: 12 passed, 12 total
Tests:       87 passed, 87 total
Coverage: 100%
```

### ✅ Checklist: Step 3

- [ ] validation.test.js completely rewritten
- [ ] Standard Schema error tests added
- [ ] Backward compatibility tests added
- [ ] middlewares.test.js updated
- [ ] Controller tests updated with multi-library support
- [ ] All tests passing
- [ ] Coverage maintained at required level

---

## 📝 Step 4: Update Examples

**Time:** 4 hours

### 4.1 Update Joi Examples with Configuration

**Files:** All `examples/controllers/**/*.js` with schemas

**Example:** `examples/controllers/windows/post.js`

**Before:**

```javascript
const schemas = {
  body: joi.object({
    id: joi
      .string()
      .guid()
      .required(),
    type: joi.string().required()
  }),
  headers: joi.object({
    'x-correlation-id': joi
      .string()
      .guid()
      .required()
  })
}
```

**After:**

```javascript
/**
 * Validation schemas using Joi.
 * Configuration is done in the schema itself using .options()
 * This is required with Standard Schema - no middleware options.
 */
const schemas = {
  body: joi
    .object({
      id: joi
        .string()
        .guid()
        .required(),
      type: joi.string().required()
    })
    .options({
      stripUnknown: true, // Remove properties not in schema
      convert: true // Enable type coercion
    }),
  headers: joi
    .object({
      'x-correlation-id': joi
        .string()
        .guid()
        .required()
    })
    .unknown(true) // Allow additional headers
}
```

### 4.2 Create Zod Example Variant

**New file:** `examples/controllers/windows-zod/post.js`

```javascript
import { z } from 'zod'

import { add, getById } from '../../repositories/window-repository.js'

const authz = claims => {
  const { customerId } = claims

  if (!customerId) {
    return Promise.resolve(false)
  }

  return Promise.resolve({ customerId })
}

const handler = async (request, response) => {
  const { id } = request.body
  const existingWindow = await getById(id)

  if (existingWindow) {
    response.redirect(303, `/windows/${id}`)
    return null
  }

  const window = request.body
  await add(window)

  return window
}

/**
 * Validation schemas using Zod.
 * Configuration is done in the schema itself using Zod methods.
 */
const schemas = {
  body: z
    .object({
      id: z.string().uuid(),
      type: z.string()
    })
    .strict(), // Reject unknown properties

  headers: z
    .object({
      'x-correlation-id': z.string().uuid()
    })
    .passthrough() // Allow additional headers
}

export { authz, handler, schemas }
```

### 4.3 Create README in Examples

**New file:** `examples/VALIDATION_EXAMPLES.md`

````markdown
# Validation Examples

This directory contains examples using different validation libraries with `@pella/rest-api`.

## Supported Libraries

All examples use Standard Schema V1 compatible libraries:

- **Joi** - Full-featured validation with extensive rules
- **Zod** - TypeScript-first schema validation
- **ArkType** - Concise type definitions
- **Valibot** - Modular, pipe-based validation

## Examples by Library

### Joi Examples

- `controllers/windows/` - All files use Joi
- Configuration via `.options()` method
- Type coercion via `convert: true`
- Unknown properties via `.unknown()` or `stripUnknown`

### Zod Examples

- `controllers/windows-zod/` - Zod variants
- Configuration via schema methods (`.strict()`, `.passthrough()`)
- Type coercion via `.coerce` or `z.pipe()`
- TypeScript-first with excellent inference

## Key Differences

### Type Coercion

**Joi:**

```javascript
joi
  .object({
    age: joi.number()
  })
  .options({ convert: true })
```
````

**Zod:**

```javascript
z.object({
  age: z.coerce.number()
})
```

### Unknown Properties

**Joi:**

```javascript
// Allow unknown
joi.object({...}).unknown(true)

// Remove unknown
joi.object({...}).options({ stripUnknown: true })

// Reject unknown (default)
joi.object({...})
```

**Zod:**

```javascript
// Allow unknown
z.object({...}).passthrough()

// Remove unknown
z.object({...}).strip()

// Reject unknown
z.object({...}).strict()
```

## Creating New Examples

When adding new examples:

1. **Choose a validation library** based on your needs
2. **Configure in the schema** - no middleware options
3. **Export schemas object** from controller
4. **Document configuration** with comments
5. **Add tests** in corresponding test file

## Running Examples

```bash
# Start the example server
npm start

# Test an endpoint
curl http://localhost:3000/windows/123
```

````
### ✅ Checklist: Step 4

- [ ] All Joi examples updated with inline configuration
- [ ] Zod example variant created
- [ ] Comments added explaining configuration
- [ ] VALIDATION_EXAMPLES.md created
- [ ] Examples verified working manually

---

## 📝 Step 5: Create Migration Documentation

**Time:** 5 hours

### 5.1 Create MIGRATION.md

**New file:** `MIGRATION.md`

```markdown
# Migration Guide: v4.x to v5.0.0

## Overview

Version 5.0.0 introduces support for multiple validation libraries through Standard Schema V1. This is a major version with breaking changes.

## What Changed

### 1. Validation Library

**Before (v4):**
- Used `express-joi-validation` (Joi-specific)
- Only Joi fully supported

**After (v5):**
- Uses `express-standard-schema-validation` (library-agnostic)
- Supports Joi, Zod, ArkType, and Valibot

### 2. Error Format

**Before (v4):**
```javascript
{
  type: 'body',
  error: {
    isJoi: true,
    message: 'ValidationError: "id" is required'
  }
}
````

**After (v5):**

```javascript
{
  type: 'body',
  message: 'Error validating request body. "id" is required',
  issues: [
    { message: '"id" is required', path: ['id'] }
  ]
}
```

### 3. Schema Configuration

**Before (v4):**

```javascript
// Some defaults were automatic
const schemas = {
  body: joi.object({
    id: joi.string().guid()
  })
  // Type conversion and unknown property handling were defaults
}
```

**After (v5):**

```javascript
// All configuration must be explicit in schema
const schemas = {
  body: joi
    .object({
      id: joi.string().guid()
    })
    .options({
      convert: true, // Must be explicit now
      stripUnknown: true // Must be explicit now
    })
}
```

## Migration Steps

### Step 1: Update Package

```bash
npm install @pella/rest-api@^5.0.0
```

This automatically brings in `express-standard-schema-validation`.

### Step 2: Choose Validation Library

Install your preferred validation library:

```bash
# If using Joi (most existing projects)
npm install joi@^18.0.0

# If using Zod
npm install zod@^3.23.0

# If using ArkType
npm install arktype@^2.0.0-beta

# If using Valibot
npm install valibot@^0.31.0
```

### Step 3: Update Schemas (Joi Users)

If you previously relied on default validation options, make them explicit:

**Before:**

```javascript
import joi from 'joi'

const schemas = {
  body: joi.object({
    age: joi.number()
  })
}
```

**After:**

```javascript
import joi from 'joi'

const schemas = {
  body: joi
    .object({
      age: joi.number()
    })
    .options({
      convert: true, // Type coercion
      stripUnknown: true, // Remove unknown properties
      abortEarly: false // Return all errors
    })
}
```

### Step 4: Update Custom Error Handlers (If Any)

If you have custom error handling:

**Before:**

```javascript
app.use((error, req, res, next) => {
  if (error.error && error.error.isJoi) {
    // Custom Joi error handling
    logger.error('Validation error:', error.error.message)
  }
  next(error)
})
```

**After:**

```javascript
app.use((error, req, res, next) => {
  if (error.issues && Array.isArray(error.issues)) {
    // Custom Standard Schema error handling
    error.issues.forEach(issue => {
      logger.error('Validation error:', issue.message)
    })
  }
  next(error)
})
```

### Step 5: Run Tests

```bash
npm test
```

Verify all tests pass with the new version.

## No Changes Required

The following continue to work without modification:

- ✅ Controller file structure
- ✅ Handler functions
- ✅ Authorization exports (`authz`, `allowNoAuth`, etc.)
- ✅ Auto-response behavior
- ✅ Middleware configuration
- ✅ HTTP status code handling

## Using New Validation Libraries

### Example: Migrating a Controller to Zod

**Original Joi version:**

```javascript
import joi from 'joi'

const schemas = {
  body: joi.object({
    email: joi
      .string()
      .email()
      .required(),
    age: joi
      .number()
      .integer()
      .min(18)
  })
}

const handler = async request => {
  // Handler code
}

export { handler, schemas }
```

**New Zod version:**

```javascript
import { z } from 'zod'

const schemas = {
  body: z
    .object({
      email: z.string().email(),
      age: z.coerce
        .number()
        .int()
        .min(18)
    })
    .strict()
}

const handler = async request => {
  // Handler code - no changes needed!
}

export { handler, schemas }
```

## Library-Specific Configuration

### Joi

```javascript
joi
  .object({
    name: joi.string()
  })
  .options({
    convert: true, // Type coercion
    stripUnknown: true, // Remove unknown properties
    allowUnknown: false, // Or reject unknown properties
    abortEarly: false // Return all errors
  })
```

### Zod

```javascript
z.object({
  name: z.string()
})
  .passthrough() // Allow unknown properties
  .strip() // Or remove unknown properties
  .strict() // Or reject unknown properties

// Type coercion
z.object({
  age: z.coerce.number() // Coerce to number
})
```

### ArkType

```javascript
type({
  name: 'string',
  age: 'string.integer.parse' // Built-in coercion
})
```

### Valibot

```javascript
v.object({
  name: v.string(),
  age: v.pipe(
    v.string(),
    v.transform(Number) // Coercion via transform
  )
})
// Use v.strictObject() or v.looseObject() for unknown properties
```

## Troubleshooting

### Issue: Validation suddenly failing

**Symptom:** Routes that worked before now return 400 errors

**Solution:** Add explicit schema configuration:

```javascript
// Add .options() to Joi schemas
.options({ convert: true, stripUnknown: true })

// Or use .coerce for Zod schemas
z.coerce.number()
```

### Issue: Unknown properties being rejected

**Symptom:** Requests with extra properties fail validation

**Solution:**

```javascript
// Joi
joi.object({...}).unknown(true)

// Zod
z.object({...}).passthrough()
```

### Issue: Custom error handler not working

**Symptom:** Custom error messages not appearing

**Solution:** Update error handler to check for `error.issues` instead of `error.error.isJoi`

### Issue: Type coercion not working

**Symptom:** String "123" not converted to number 123

**Solution:**

```javascript
// Joi - add convert option
joi
  .object({
    age: joi.number()
  })
  .options({ convert: true })

// Zod - use coerce
z.object({
  age: z.coerce.number()
})
```

## Breaking Changes Summary

| Feature       | v4.x                   | v5.0.0                             |
| ------------- | ---------------------- | ---------------------------------- |
| Package       | express-joi-validation | express-standard-schema-validation |
| Libraries     | Joi only               | Joi, Zod, ArkType, Valibot         |
| Options       | Some defaults          | All explicit in schema             |
| Error format  | `error.error.isJoi`    | `error.issues[]`                   |
| Configuration | Mixed                  | Schema only                        |

## Support

If you encounter issues during migration:

1. Check this guide for common solutions
2. Review the [examples/](./examples/) directory
3. Check validation library documentation
4. Create an issue on GitHub

## FAQ

### Q: Do I have to migrate all controllers at once?

**A:** No. You can migrate incrementally. Existing Joi schemas work with minimal changes (adding `.options()` if needed).

### Q: Can I use multiple validation libraries?

**A:** Yes! You can use Joi in some controllers and Zod in others. They all work through the same middleware.

### Q: Will this affect performance?

**A:** No significant performance impact. Standard Schema is a thin interface over native library validation.

### Q: What if I don't want to change anything?

**A:** Minimal changes needed. Install Joi as peer dependency, add `.options()` to schemas if you relied on defaults, and you're done.

### Q: Which library should I use?

**A:**

- **Joi** - Best for complex validation rules and migrations
- **Zod** - Best for TypeScript projects
- **ArkType** - Best for concise definitions
- **Valibot** - Best for modular, functional approach

## Resources

- [Standard Schema Specification](https://github.com/standard-schema/standard-schema)
- [Joi Documentation](https://joi.dev/)
- [Zod Documentation](https://zod.dev/)
- [ArkType Documentation](https://arktype.io/)
- [Valibot Documentation](https://valibot.dev/)
- [express-standard-schema-validation](https://www.npmjs.com/package/express-standard-schema-validation)

---

**Migration Guide Version:** 1.0.0  
**For @pella/rest-api:** v5.0.0  
**Last Updated:** DD/MM/YYYY

````
### 5.2 Update README.md

**File:** `README.md`

Update the Schema Validation section (lines 323-404):

```markdown
### Schema Validation

This framework uses [Standard Schema V1](https://github.com/standard-schema/standard-schema) compatible validation libraries. You can use any of the following:

- **Joi** v18.0.0+
- **Zod** v3.23.0+
- **ArkType** v2.0.0-beta+
- **Valibot** v0.31.0+

#### Installing a Validation Library

You must install at least one validation library:

```bash
# Choose one or more:
npm install joi            # Joi 18+
npm install zod            # Zod 3.23+
npm install arktype        # ArkType 2.0+
npm install valibot        # Valibot 0.31+
````

#### Using Validation

Export a `schemas` object from your controller containing the schemas you want validated:

##### Joi Example

```js
import joi from 'joi'

const schemas = {
  body: joi
    .object({
      id: joi
        .string()
        .guid()
        .required(),
      type: joi.string().required()
    })
    .options({
      convert: true, // Enable type coercion
      stripUnknown: true // Remove unknown properties
    }),
  headers: joi
    .object({
      'x-correlation-id': joi
        .string()
        .guid()
        .required()
    })
    .unknown(true) // Allow additional headers
}

export { schemas }
```

##### Zod Example

```js
import { z } from 'zod'

const schemas = {
  body: z
    .object({
      id: z.string().uuid(),
      type: z.string()
    })
    .strict(), // Reject unknown properties

  headers: z
    .object({
      'x-correlation-id': z.string().uuid()
    })
    .passthrough() // Allow additional headers
}

export { schemas }
```

##### ArkType Example

```js
import { type } from 'arktype'

const schemas = {
  body: type({
    id: 'string.uuid',
    type: 'string'
  }),
  headers: type({
    'x-correlation-id': 'string.uuid'
  })
}

export { schemas }
```

##### Valibot Example

```js
import * as v from 'valibot'

const schemas = {
  body: v.strictObject({
    id: v.pipe(
      v.string(),
      v.uuid()
    ),
    type: v.string()
  }),
  headers: v.looseObject({
    'x-correlation-id': v.pipe(
      v.string(),
      v.uuid()
    )
  })
}

export { schemas }
```

#### Configuration

**Important:** All validation behavior (type coercion, unknown property handling, error formatting) is configured in the schema itself, not in middleware.

Each library has its own configuration approach:

- **Joi:** `.options()` method
- **Zod:** Schema methods (`.strict()`, `.passthrough()`, `.coerce`)
- **ArkType:** Built into type definitions
- **Valibot:** Pipes and schema variants (`strictObject`, `looseObject`)

See [MIGRATION.md](./MIGRATION.md) for detailed configuration examples.

#### Validated Request Parts

You can validate four parts of the request:

**Body** - Request body (requires body parser)
**Params** - URL parameters (e.g., `/users/:id`)
**Query** - Query string parameters
**Headers** - Request headers

Example with multiple validations:

```js
const schemas = {
  params: joi.object({
    id: joi
      .string()
      .guid()
      .required()
  }),
  query: joi.object({
    include: joi.array().items(joi.string())
  }),
  headers: joi
    .object({
      'x-correlation-id': joi
        .string()
        .guid()
        .required()
    })
    .unknown(true)
}
```

````
### 5.3 Update CHANGELOG.md

**File:** `CHANGELOG.md`

Add at the top:

```markdown
## 5.0.0 (DD/MM/YYYY)

### Breaking Changes
* **Validation Library Change**: Replaced `express-joi-validation` with `express-standard-schema-validation`
* **Multi-Library Support**: Now supports Joi, Zod, ArkType, and Valibot
* **Schema Configuration**: All validation options must now be configured in schemas, not middleware
* **Error Format**: Validation errors now use Standard Schema `issues` array format
* **Function Rename**: `catchJoiValidationErrors` renamed to `catchValidationErrors` (alias kept for compatibility)

### New Features
* Support for multiple validation libraries through Standard Schema V1
* Choose any compatible validation library (Joi, Zod, ArkType, Valibot)
* Mix and match validation libraries in different routes
* Improved error messages with structured `issues` array
* Better TypeScript support for validation schemas

### Migration
* See [MIGRATION.md](./MIGRATION.md) for detailed migration guide
* Joi users: Add `.options()` to schemas if you relied on defaults
* Install your preferred validation library as a peer dependency
* Update custom error handlers to use `error.issues` instead of `error.error.isJoi`

### Compatibility
* Maintains backward compatibility with Joi error format during transition
* Controller structure unchanged
* Handler functions unchanged
* Authorization patterns unchanged
* Auto-response behavior unchanged

### Dependencies
* Added: `express-standard-schema-validation@^1.0.0`
* Removed: `express-joi-validation`
* Updated: Zod peer dependency to `>=3.23.0`
* Added: ArkType and Valibot as optional peer dependencies

### Documentation
* Comprehensive migration guide
* Examples for all four validation libraries
* Updated README with multi-library usage
* Added validation configuration guide
````

### ✅ Checklist: Step 5

- [ ] MIGRATION.md created with comprehensive guide
- [ ] README.md updated with multi-library examples
- [ ] CHANGELOG.md updated with v5.0.0 entry
- [ ] All documentation reviewed for accuracy
- [ ] Examples cross-referenced correctly

---

## 📝 Step 6: Final Verification

**Time:** 1 hour

### 6.1 Run Full Test Suite

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Run all tests
npm test

# Run acceptance tests
npm run test:acceptance
```

**Expected output:**

```
✓ All unit tests passing
✓ All acceptance tests passing
✓ Coverage at required level
```

### 6.2 Manual Testing

```bash
# Start example server
npm start

# In another terminal, test endpoints
curl http://localhost:3000/windows
curl -X POST http://localhost:3000/windows \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: $(uuidgen)" \
  -d '{"id":"'$(uuidgen)'","type":"test"}'
```

### 6.3 Lint and Format

```bash
npm run lint
npm run lint:fix
```

### 6.4 Build Verification

```bash
# If your project has a build step
npm run build
```

### ✅ Checklist: Step 6

- [ ] Clean install successful
- [ ] All unit tests pass
- [ ] All acceptance tests pass
- [ ] Coverage requirements met
- [ ] Linting passes
- [ ] Manual testing successful
- [ ] Build successful (if applicable)

---

## 🎉 Phase 2 Complete!

### Summary of Achievements

✅ **Dependencies Updated**

- express-standard-schema-validation integrated
- All validation libraries available
- Version bumped to 5.0.0

✅ **Code Updated**

- controllers.js import updated
- validation.js rewritten for Standard Schema
- Backward compatibility maintained
- middlewares.js updated with new naming

✅ **Tests Updated**

- Comprehensive Standard Schema tests
- Multi-library test coverage
- Backward compatibility tests
- 100% coverage maintained

✅ **Examples Updated**

- Joi examples updated with configuration
- Zod examples created
- Documentation added

✅ **Documentation Complete**

- MIGRATION.md guide created
- README.md updated
- CHANGELOG.md updated
- All breaking changes documented

### Metrics

- **Tests:** 87 passing
- **Coverage:** 100% (maintained)
- **Libraries Supported:** 4
- **Documentation Pages:** 3 major updates
- **Time Taken:** ~2-3 days

### What's Next?

Proceed to **[Phase 3: Testing Strategy](./PHASE_3_TESTING.md)** for comprehensive testing across all validation libraries.

---

## 🐛 Troubleshooting

### Issue: Import errors after dependency update

**Symptom:** `Cannot find module 'express-standard-schema-validation'`

**Solution:**

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Tests failing with validation errors

**Symptom:** Controllers returning 400 when they shouldn't

**Solution:** Check if schemas need explicit configuration:

```javascript
// Add .options() to Joi schemas
.options({ convert: true })
```

### Issue: Lint errors in new code

**Symptom:** ESLint errors

**Solution:**

```bash
npm run lint:fix
```

### Issue: Type errors in TypeScript

**Symptom:** TypeScript compilation fails

**Solution:** Verify all libraries have `~standard` property checks

### Issue: Acceptance tests failing

**Symptom:** Integration tests fail

**Solution:**

1. Verify all dependencies installed
2. Check validation library versions
3. Ensure schemas have correct configuration

---

**Phase 2 Document Version:** 1.0.0  
**Last Updated:** DD/MM/YYYY  
**Previous Phase:** [Phase 1: Express Standard Schema](./PHASE_1_EXPRESS_STANDARD_SCHEMA.md)  
**Next Phase:** [Phase 3: Testing Strategy](./PHASE_3_TESTING.md)
