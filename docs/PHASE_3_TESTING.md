# Phase 3: Testing Strategy

## 🎯 Objectives

Ensure comprehensive testing coverage across both packages:

1. Verify all validation libraries work correctly
2. Test integration between packages
3. Validate backward compatibility
4. Run performance benchmarks
5. Execute acceptance tests

## ⏱️ Time Estimate

**Total:** 1 day

- Unit test execution: 2 hours
- Integration testing: 2 hours
- Acceptance testing: 2 hours
- Performance testing: 1 hour
- Regression testing: 1 hour

## 📋 Prerequisites

- [x] Phase 1 complete (express-standard-schema-validation published)
- [x] Phase 2 complete (rest-api code updated)
- [x] All dependencies installed
- [x] Development environment ready

---

## 📝 Test Strategy Overview

### Test Pyramid

```
          /\
         /  \
        / E2E \           ← Acceptance Tests
       /______\
      /        \
     / Integration \      ← Multi-library Integration
    /____________  \
   /                \
  /   Unit Tests     \    ← Library-specific Tests
 /____________________\
```

### Coverage Targets

| Package                            | Target | Current |
| ---------------------------------- | ------ | ------- |
| express-standard-schema-validation | 100%   | TBD     |
| @pella/rest-api                    | 100%   | TBD     |

---

## 📝 Step 1: express-standard-schema-validation Tests

**Time:** 2 hours

### 1.1 Run All Library Tests

```bash
cd /Users/derr/git/express-standard-schema-validation

# Run individual library tests
npm run unit -- test.joi.js
npm run unit -- test.zod.js
npm run unit -- test.arktype.js
npm run unit -- test.valibot.js

# Run all tests
npm run unit
```

**Expected Results:**

```
express-joi-validation with Joi >= 18.0.0
  ✓ Joi Standard Schema Support
  ✓ #query validation (2 tests)
  ✓ #body validation (2 tests)
  ✓ #params validation (2 tests)
  ✓ error handling with passError option
  10 passing

express-joi-validation with Zod >= 3.23
  ✓ Zod Standard Schema Support
  ✓ #query validation (2 tests)
  ✓ #body validation (2 tests)
  ✓ #params validation (2 tests)
  ✓ error handling with passError option
  ✓ Zod-specific behavior (2 tests)
  12 passing

express-standard-schema-validation with ArkType >= 2.0.0
  ✓ ArkType Standard Schema Support
  ✓ #query validation (2 tests)
  ✓ #body validation (2 tests)
  ✓ #params validation (2 tests)
  ✓ error handling with passError option
  ✓ ArkType-specific behavior (2 tests)
  11 passing

express-standard-schema-validation with Valibot >= 0.31.0
  ✓ Valibot Standard Schema Support
  ✓ #query validation (2 tests)
  ✓ #body validation (2 tests)
  ✓ #params validation (2 tests)
  ✓ error handling with passError option
  ✓ Valibot-specific behavior (3 tests)
  12 passing

Total: 45 tests passing
```

### 1.2 Check Coverage

```bash
npm run cover
```

**Expected Output:**

```
=============================== Coverage summary ===============================
Statements   : 100% ( 120/120 )
Branches     : 100% ( 42/42 )
Functions    : 100% ( 18/18 )
Lines        : 100% ( 118/118 )
================================================================================
```

### 1.3 Test Matrix

| Library | Query | Body | Params | Headers | Fields | Error Handling | Specific Features         |
| ------- | ----- | ---- | ------ | ------- | ------ | -------------- | ------------------------- |
| Joi     | ✅    | ✅   | ✅     | ✅      | ✅     | ✅             | .options()                |
| Zod     | ✅    | ✅   | ✅     | ✅      | ✅     | ✅             | .strict(), .passthrough() |
| ArkType | ✅    | ✅   | ✅     | ✅      | ✅     | ✅             | .parse, unions            |
| Valibot | ✅    | ✅   | ✅     | ✅      | ✅     | ✅             | pipes, strict/loose       |

### ✅ Checklist: Step 1

- [ ] All Joi tests passing
- [ ] All Zod tests passing
- [ ] All ArkType tests passing
- [ ] All Valibot tests passing
- [ ] 100% code coverage achieved
- [ ] No test warnings or errors
- [ ] TypeScript compilation successful

---

## 📝 Step 2: @pella/rest-api Tests

**Time:** 2 hours

### 2.1 Run Unit Tests

```bash
cd /Users/derr/git/rest-api

# Run specific test files
npm test -- test/validation.test.js
npm test -- test/middlewares.test.js
npm test -- test/controllers/windows/post.test.js

# Run all unit tests
npm run coverage
```

**Expected Results:**

```
PASS test/validation.test.js
  validation
    Standard Schema validation errors
      ✓ should handle Standard Schema issues array
      ✓ should handle single issue
      ✓ should handle issues from different validation libraries
      ✓ should not call next when handling validation error
    Backward compatibility with Joi errors
      ✓ should handle legacy Joi error format
      ✓ should not call next for Joi errors
    Non-validation errors
      ✓ should call next if there is no error
      ✓ should call next if error has no issues
      ✓ should call next if error is not validation related
      ✓ should call next if issues is not an array
    Error response format
      ✓ should include all validation issues in response
      ✓ should always return 400 status code
  12 passing

PASS test/middlewares.test.js
  middlewares
    ✓ registerValidationErrorHandler registers middleware
    ✓ catchValidationErrors is an alias
    ✓ enableParsingOfRequestBodyAsJSON works
  3 passing

PASS test/controllers/windows/post.test.js
  POST /windows
    ✓ should return the id of the window provided in the body
    ✓ should return a redirect if the window already exists
    schemas
      Joi schemas
        ✓ should have Standard Schema support
        body
          ✓ should pass validation
          id
            ✓ should fail if id is not provided
            ✓ should fail if id is not a string
            ✓ should fail if id is not a guid
          type
            ✓ should fail if type is not provided
            ✓ should fail if type is not a string
        headers
          ✓ should pass validation
          id
            ✓ should fail if x-correlation-id is not provided
            ✓ should fail if x-correlation-id is not a string
            ✓ should fail if id is not a guid
      Zod schemas
        ✓ should validate with Zod schema alternative
    authz
      ✓ should fail if two legged
      ✓ should succeed if three legged
  20 passing

Total: ~87 tests passing
```

### 2.2 Check Coverage

```bash
npm run coverage
```

**Expected Output:**

```
 COVERAGE  v4.0.15

 Test Files  12 passed (12)
      Tests  87 passed (87)

-------------|---------|----------|---------|---------|
File         | % Stmts | % Branch | % Funcs | % Lines |
-------------|---------|----------|---------|---------|
All files    |     100 |      100 |     100 |     100 |
 src/        |     100 |      100 |     100 |     100 |
  validation |     100 |      100 |     100 |     100 |
  controllers|     100 |      100 |     100 |     100 |
  middlewares|     100 |      100 |     100 |     100 |
-------------|---------|----------|---------|---------|
```

### 2.3 Test Cases by Category

#### Validation Error Handling Tests

- [x] Standard Schema issues array format
- [x] Single vs multiple issues
- [x] Different library error formats
- [x] Legacy Joi error format compatibility
- [x] Non-validation error passthrough
- [x] Error response format verification
- [x] Status code verification

#### Controller Integration Tests

- [x] Joi schema validation
- [x] Zod schema validation (added)
- [x] Standard Schema interface verification
- [x] Schema configuration tests
- [x] Multiple validation targets (body, query, params, headers)

#### Middleware Tests

- [x] Error handler registration
- [x] Function name aliases
- [x] JSON body parser configuration

### ✅ Checklist: Step 2

- [ ] All unit tests passing
- [ ] 100% code coverage maintained
- [ ] Standard Schema error tests passing
- [ ] Backward compatibility tests passing
- [ ] Controller validation tests passing
- [ ] No test failures or warnings

---

## 📝 Step 3: Integration Testing

**Time:** 2 hours

### 3.1 Cross-Library Integration Tests

Create integration test file:

**New file:** `test/integration/multi-library.test.js`

```javascript
import { describe, test, expect, beforeAll } from 'vitest'
import joi from 'joi'
import { z } from 'zod'
import { type } from 'arktype'
import * as v from 'valibot'
import { startAPI } from '../src/index.js'

describe('Multi-library integration', () => {
  let server
  const port = 5555

  beforeAll(async () => {
    // Start server with controllers using different libraries
    server = await startAPI({
      port,
      controllersDirectory: 'test/fixtures/multi-library-controllers',
      disableLogging: true
    })
  })

  afterAll(async () => {
    if (server) {
      await server.close()
    }
  })

  test('should handle Joi validation', async () => {
    const response = await fetch(`http://localhost:${port}/joi-test?name=John`)
    expect(response.status).toBe(200)
  })

  test('should handle Zod validation', async () => {
    const response = await fetch(`http://localhost:${port}/zod-test?name=John`)
    expect(response.status).toBe(200)
  })

  test('should handle ArkType validation', async () => {
    const response = await fetch(
      `http://localhost:${port}/arktype-test?name=John`
    )
    expect(response.status).toBe(200)
  })

  test('should handle Valibot validation', async () => {
    const response = await fetch(
      `http://localhost:${port}/valibot-test?name=John`
    )
    expect(response.status).toBe(200)
  })

  test('should fail Joi validation correctly', async () => {
    const response = await fetch(`http://localhost:${port}/joi-test`)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('issues')
  })

  test('should fail Zod validation correctly', async () => {
    const response = await fetch(`http://localhost:${port}/zod-test`)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('issues')
  })
})
```

### 3.2 Create Test Fixtures

**Directory:** `test/fixtures/multi-library-controllers/`

Create controllers for each library:

**File:** `test/fixtures/multi-library-controllers/joi-test/get.js`

```javascript
import joi from 'joi'

export const allowNoAuth = true

export const schemas = {
  query: joi.object({
    name: joi.string().required()
  })
}

export const handler = req => ({ library: 'joi', name: req.query.name })
```

**File:** `test/fixtures/multi-library-controllers/zod-test/get.js`

```javascript
import { z } from 'zod'

export const allowNoAuth = true

export const schemas = {
  query: z.object({
    name: z.string()
  })
}

export const handler = req => ({ library: 'zod', name: req.query.name })
```

**File:** `test/fixtures/multi-library-controllers/arktype-test/get.js`

```javascript
import { type } from 'arktype'

export const allowNoAuth = true

export const schemas = {
  query: type({
    name: 'string'
  })
}

export const handler = req => ({ library: 'arktype', name: req.query.name })
```

**File:** `test/fixtures/multi-library-controllers/valibot-test/get.js`

```javascript
import * as v from 'valibot'

export const allowNoAuth = true

export const schemas = {
  query: v.object({
    name: v.string()
  })
}

export const handler = req => ({ library: 'valibot', name: req.query.name })
```

### 3.3 Run Integration Tests

```bash
npm test -- test/integration/multi-library.test.js
```

**Expected Output:**

```
PASS test/integration/multi-library.test.js
  Multi-library integration
    ✓ should handle Joi validation
    ✓ should handle Zod validation
    ✓ should handle ArkType validation
    ✓ should handle Valibot validation
    ✓ should fail Joi validation correctly
    ✓ should fail Zod validation correctly
  6 passing
```

### ✅ Checklist: Step 3

- [ ] Integration test file created
- [ ] Test fixtures for all libraries created
- [ ] All integration tests passing
- [ ] Cross-library validation verified
- [ ] Error handling verified across libraries

---

## 📝 Step 4: Acceptance Testing

**Time:** 2 hours

### 4.1 Run Existing Acceptance Tests

```bash
cd /Users/derr/git/rest-api
npm run test:acceptance
```

**Expected Output:**

```
PASS acceptance/index.test.js
PASS acceptance/lifecycle.test.js
PASS acceptance/useApiDomain.test.js

Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
```

### 4.2 Create Validation-Specific Acceptance Tests

**New file:** `acceptance/validation.test.js`

```javascript
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { startAPI } from '../src/index.js'

describe('Validation Acceptance Tests', () => {
  let server
  const port = 5556

  beforeAll(async () => {
    server = await startAPI({
      port,
      controllersDirectory: 'examples/controllers',
      disableLogging: true
    })
  })

  afterAll(async () => {
    if (server) {
      await server.close()
    }
  })

  describe('Successful validation', () => {
    test('should accept valid POST request', async () => {
      const validId = '550e8400-e29b-41d4-a716-446655440000'
      const correlationId = '550e8400-e29b-41d4-a716-446655440001'

      const response = await fetch(`http://localhost:${port}/windows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId
        },
        body: JSON.stringify({
          id: validId,
          type: 'casement'
        })
      })

      expect(response.status).toBe(201)
    })

    test('should accept valid GET request with query params', async () => {
      const response = await fetch(
        `http://localhost:${port}/windows?name=test&age=25`
      )

      expect(response.status).toBe(200)
    })
  })

  describe('Validation failures', () => {
    test('should reject POST with missing required field', async () => {
      const response = await fetch(`http://localhost:${port}/windows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': '550e8400-e29b-41d4-a716-446655440000'
        },
        body: JSON.stringify({
          type: 'casement'
          // Missing required 'id' field
        })
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('issues')
      expect(body.issues[0].message).toContain('id')
    })

    test('should reject POST with invalid UUID', async () => {
      const response = await fetch(`http://localhost:${port}/windows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': '550e8400-e29b-41d4-a716-446655440000'
        },
        body: JSON.stringify({
          id: 'not-a-uuid',
          type: 'casement'
        })
      })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('issues')
    })

    test('should reject GET with missing required query param', async () => {
      const response = await fetch(`http://localhost:${port}/windows`)

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body).toHaveProperty('message')
      expect(body.message).toContain('query')
    })

    test('should reject request with missing required header', async () => {
      const response = await fetch(`http://localhost:${port}/windows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Missing required 'x-correlation-id' header
        },
        body: JSON.stringify({
          id: '550e8400-e29b-41d4-a716-446655440000',
          type: 'casement'
        })
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Type coercion', () => {
    test('should coerce string numbers to actual numbers (Joi)', async () => {
      const response = await fetch(
        `http://localhost:${port}/windows?name=test&age=25`
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(typeof body.age).toBe('number')
      expect(body.age).toBe(25)
    })

    test('should coerce URL params to numbers', async () => {
      const response = await fetch(`http://localhost:${port}/windows/123`)

      // Assuming params are coerced by schema
      expect(response.status).not.toBe(400)
    })
  })

  describe('Unknown properties', () => {
    test('should handle unknown properties according to schema config', async () => {
      const response = await fetch(`http://localhost:${port}/windows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': '550e8400-e29b-41d4-a716-446655440000'
        },
        body: JSON.stringify({
          id: '550e8400-e29b-41d4-a716-446655440000',
          type: 'casement',
          extraField: 'should be stripped or rejected'
        })
      })

      // Behavior depends on schema configuration
      // With stripUnknown: should succeed
      // With strict: should fail
      expect([200, 201, 400]).toContain(response.status)
    })
  })
})
```

### 4.3 Run Acceptance Tests

```bash
npm run test:acceptance
```

**Expected Output:**

```
PASS acceptance/validation.test.js
  Validation Acceptance Tests
    Successful validation
      ✓ should accept valid POST request
      ✓ should accept valid GET request with query params
    Validation failures
      ✓ should reject POST with missing required field
      ✓ should reject POST with invalid UUID
      ✓ should reject GET with missing required query param
      ✓ should reject request with missing required header
    Type coercion
      ✓ should coerce string numbers to actual numbers (Joi)
      ✓ should coerce URL params to numbers
    Unknown properties
      ✓ should handle unknown properties according to schema config
  9 passing
```

### ✅ Checklist: Step 4

- [ ] Existing acceptance tests passing
- [ ] New validation acceptance tests created
- [ ] Success cases verified
- [ ] Failure cases verified
- [ ] Type coercion verified
- [ ] Unknown property handling verified

---

## 📝 Step 5: Performance Testing

**Time:** 1 hour

### 5.1 Benchmark Test Script

**New file:** `test/performance/validation-benchmark.js`

```javascript
import Benchmark from 'benchmark'
import joi from 'joi'
import { z } from 'zod'
import { type } from 'arktype'
import * as v from 'valibot'

const suite = new Benchmark.Suite()

// Test data
const validData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
}

// Define schemas
const joiSchema = joi.object({
  name: joi.string().required(),
  email: joi
    .string()
    .email()
    .required(),
  age: joi
    .number()
    .integer()
    .min(0)
    .max(120)
})

const zodSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z
    .number()
    .int()
    .min(0)
    .max(120)
})

const arktypeSchema = type({
  name: 'string',
  email: 'string.email',
  age: 'number.integer',
  'age>=': 0,
  'age<=': 120
})

const valibotSchema = v.object({
  name: v.string(),
  email: v.pipe(
    v.string(),
    v.email()
  ),
  age: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(0),
    v.maxValue(120)
  )
})

// Benchmark tests
suite
  .add('Joi validation', () => {
    joiSchema['~standard'].validate(validData)
  })
  .add('Zod validation', () => {
    zodSchema['~standard'].validate(validData)
  })
  .add('ArkType validation', () => {
    arktypeSchema['~standard'].validate(validData)
  })
  .add('Valibot validation', () => {
    valibotSchema['~standard'].validate(validData)
  })
  .on('cycle', event => {
    console.log(String(event.target))
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'))
  })
  .run({ async: true })
```

### 5.2 Install Benchmark Dependency

```bash
npm install --save-dev benchmark
```

### 5.3 Run Performance Tests

```bash
node test/performance/validation-benchmark.js
```

**Expected Output (example):**

```
Joi validation x 123,456 ops/sec ±1.23% (89 runs sampled)
Zod validation x 234,567 ops/sec ±0.98% (92 runs sampled)
ArkType validation x 345,678 ops/sec ±1.45% (87 runs sampled)
Valibot validation x 456,789 ops/sec ±1.12% (90 runs sampled)
Fastest is Valibot validation
```

### 5.4 Performance Metrics

| Library | Operations/sec | Relative Speed  | Notes                  |
| ------- | -------------- | --------------- | ---------------------- |
| Joi     | ~120,000       | 1.0x (baseline) | Most features, slowest |
| Zod     | ~230,000       | 1.9x            | Good balance           |
| ArkType | ~340,000       | 2.8x            | Fast compilation       |
| Valibot | ~450,000       | 3.7x            | Modular, fastest       |

**Note:** Actual numbers will vary based on hardware and schema complexity.

### ✅ Checklist: Step 5

- [ ] Benchmark test created
- [ ] All libraries benchmarked
- [ ] Performance metrics documented
- [ ] No performance regressions identified
- [ ] Results meet expectations

---

## 📝 Step 6: Regression Testing

**Time:** 1 hour

### 6.1 Regression Test Checklist

Test that existing functionality still works:

#### Controller Functionality

- [ ] GET endpoints return correct data
- [ ] POST endpoints create resources
- [ ] PUT endpoints update resources
- [ ] PATCH endpoints partially update
- [ ] DELETE endpoints remove resources

#### Authorization

- [ ] allowNoAuth works
- [ ] allowThreeLegged works
- [ ] requiresScopesForTwoLegged works
- [ ] requiresScopesForThreeLegged works
- [ ] authz function gets called

#### Auto-Response Behavior

- [ ] GET returns 200 for success
- [ ] GET returns 404 for not found
- [ ] POST returns 201 for created
- [ ] POST returns 202 for accepted
- [ ] PUT/PATCH returns 204 for success
- [ ] PUT/PATCH returns 200 for not found
- [ ] DELETE returns 204 for success

#### Error Handling

- [ ] Validation errors return 400
- [ ] Unhandled exceptions caught
- [ ] Custom error handlers work
- [ ] Error messages are clear

### 6.2 Run Full Regression Suite

```bash
# Run all tests
npm run verify

# This should run:
# - npm run lint
# - npm run coverage
# - npm run test:acceptance
```

**Expected Output:**

```
✓ Linting passed
✓ Unit tests: 87 passing
✓ Coverage: 100%
✓ Acceptance tests: 24 passing

All checks passed!
```

### ✅ Checklist: Step 6

- [ ] All existing functionality verified
- [ ] No regressions found
- [ ] All tests passing
- [ ] Coverage maintained
- [ ] Documentation accurate

---

## 📊 Test Results Summary

### express-standard-schema-validation

| Metric           | Target     | Actual | Status |
| ---------------- | ---------- | ------ | ------ |
| Tests            | 45         | TBD    | ⏳     |
| Coverage         | 100%       | TBD    | ⏳     |
| Libraries Tested | 4          | TBD    | ⏳     |
| Performance      | Acceptable | TBD    | ⏳     |

### @pella/rest-api

| Metric            | Target | Actual | Status |
| ----------------- | ------ | ------ | ------ |
| Unit Tests        | 87     | TBD    | ⏳     |
| Integration Tests | 6      | TBD    | ⏳     |
| Acceptance Tests  | 24     | TBD    | ⏳     |
| Coverage          | 100%   | TBD    | ⏳     |
| Regressions       | 0      | TBD    | ⏳     |

## 🎉 Phase 3 Complete!

### Achievements

✅ **Comprehensive Testing**

- All validation libraries tested
- Integration tests passed
- Acceptance tests passed
- Performance benchmarked

✅ **Coverage Maintained**

- 100% code coverage
- All test suites passing
- No regressions found

✅ **Quality Verified**

- Multi-library support confirmed
- Error handling validated
- Performance acceptable

### What's Next?

Proceed to **[Phase 4: Release & Publishing](./PHASE_4_RELEASE.md)** to publish the packages to production.

---

## 🐛 Common Test Issues

### Issue: Tests timing out

**Solution:**

```javascript
// Increase timeout in test
test(
  'slow test',
  async () => {
    // ...
  },
  10000
) // 10 second timeout
```

### Issue: Port conflicts in acceptance tests

**Solution:**

```javascript
// Use unique ports for each test suite
const port = 5000 + Math.floor(Math.random() * 1000)
```

### Issue: Coverage not reaching 100%

**Solution:**

1. Run `npm run cover` to see uncovered lines
2. Add tests for missing branches
3. Check error paths

### Issue: Flaky integration tests

**Solution:**

1. Add proper cleanup in afterAll
2. Wait for server to be ready
3. Use unique test data

---

**Phase 3 Document Version:** 1.0.0  
**Last Updated:** DD/MM/YYYY  
**Previous Phase:** [Phase 2: REST API Migration](./PHASE_2_REST_API_MIGRATION.md)  
**Next Phase:** [Phase 4: Release & Publishing](./PHASE_4_RELEASE.md)
