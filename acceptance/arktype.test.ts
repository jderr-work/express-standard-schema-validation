import { describe, test, expect } from 'vitest';
import { type } from 'arktype';
import { createTestApp, startTestServer, stopTestServer } from './setup.js';
import { expectSuccess, expectValidationError, get, post, getWithHeaders } from './helpers.js';
import { createValidator } from '../dist/index.js';

describe('express-standard-schema-validation with ArkType >= 2.0.0-rc', () => {
  describe('ArkType Standard Schema Support', () => {
    test('should validate that ArkType schemas implement Standard Schema', () => {
      const arktypeSchema = type({
        key: 'number',
      });

      // Check that ArkType 2.0+ has Standard Schema support
      expect(arktypeSchema).toHaveProperty('~standard');
      expect(arktypeSchema['~standard']).toHaveProperty('version', 1);
      expect(arktypeSchema['~standard']).toHaveProperty('validate');
      expect(arktypeSchema['~standard'].validate).toBeTypeOf('function');
    });
  });

  describe('#query validation', () => {
    test('should successfully validate a query using ArkType', async () => {
      const validator = createValidator();
      const schema = type({
        name: 'string',
        'age?': 'number',
      });

      const app = createTestApp();
      app.get('/test', validator.query(schema), (_req, res) => {
        res.status(200).json(_req.query);
      });

      const testServer = await startTestServer(app);
      const data = await expectSuccess(get(testServer.baseUrl, '/test', { name: 'John' }));
      expect(data.name).toBe('John');
      await stopTestServer(testServer.server);
    });

    test('should coerce string to number in query', async () => {
      const validator = createValidator();
      const schema = type({
        name: 'string',
        age: 'string.numeric.parse',
      });

      const app = createTestApp();
      app.get('/test', validator.query(schema), (_req, res) => {
        expect(_req.query.name).toBe('John');
        expect(_req.query.age).toBe(25);
        expect(_req.query.age).toBeTypeOf('number');
        res.status(200).json(_req.query);
      });

      const testServer = await startTestServer(app);
      const data = await expectSuccess(get(testServer.baseUrl, '/test', { name: 'John', age: '25' }));
      expect(data.name).toBe('John');
      expect(data.age).toBe(25);
      await stopTestServer(testServer.server);
    });

    test('should fail validation with invalid query', async () => {
      const validator = createValidator();
      const schema = type({
        name: 'string',
        age: 'number',
      });

      const app = createTestApp();
      app.get('/test', validator.query(schema), (_req, res) => {
        res.status(200).end('ok');
      });

      const testServer = await startTestServer(app);
      const error = await expectValidationError(get(testServer.baseUrl, '/test'));
      expect(error).toContain('Error validating request query');
      await stopTestServer(testServer.server);
    });
  });

  describe('#body validation', () => {
    test('should successfully validate a body using ArkType', async () => {
      const validator = createValidator();
      const schema = type({
        username: 'string',
        email: 'string.email',
      });

      const app = createTestApp();
      app.post('/test', validator.body(schema), (_req, res) => {
        res.status(200).json(_req.body);
      });

      const testServer = await startTestServer(app);
      const data = await expectSuccess(
        post(testServer.baseUrl, '/test', {
          username: 'john',
          email: 'john@example.com',
        }),
      );
      expect(data.username).toBe('john');
      expect(data.email).toBe('john@example.com');
      await stopTestServer(testServer.server);
    });

    test('should fail validation with invalid body', async () => {
      const validator = createValidator();
      const schema = type({
        username: 'string',
        email: 'string.email',
      });

      const app = createTestApp();
      app.post('/test', validator.body(schema), (_req, res) => {
        res.status(200).end('ok');
      });

      const testServer = await startTestServer(app);
      const error = await expectValidationError(
        post(testServer.baseUrl, '/test', {
          username: 'john',
          email: 'not-an-email',
        }),
      );
      expect(error).toContain('Error validating request body');
      await stopTestServer(testServer.server);
    });

    test('should validate nested objects', async () => {
      const validator = createValidator();
      const schema = type({
        user: {
          name: 'string',
          age: 'number',
        },
      });

      const app = createTestApp();
      app.post('/test', validator.body(schema), (_req, res) => {
        expect(_req.body.user.name).toBe('John');
        expect(_req.body.user.age).toBe(30);
        res.status(200).json(_req.body);
      });

      const testServer = await startTestServer(app);
      const data = await expectSuccess(post(testServer.baseUrl, '/test', { user: { name: 'John', age: 30 } }));
      expect(data.user.name).toBe('John');
      expect(data.user.age).toBe(30);
      await stopTestServer(testServer.server);
    });
  });

  describe('#params validation', () => {
    test('should successfully validate params using ArkType', async () => {
      const validator = createValidator();
      const schema = type({
        id: 'string.numeric.parse',
      });

      const app = createTestApp();
      app.get('/test/:id', validator.params(schema), (_req, res) => {
        expect(_req.params.id).toBeTypeOf('number');
        expect(_req.params.id).toBe(123);
        res.status(200).json(_req.params);
      });

      const testServer = await startTestServer(app);
      const data = await expectSuccess(get(testServer.baseUrl, '/test/123'));
      expect(data.id).toBe(123);
      await stopTestServer(testServer.server);
    });

    test('should fail validation with invalid params', async () => {
      const validator = createValidator();
      const schema = type({
        id: 'number>0<101',
      });

      const app = createTestApp();
      app.get('/test/:id', validator.params(schema), (_req, res) => {
        res.status(200).end('ok');
      });

      const testServer = await startTestServer(app);
      const error = await expectValidationError(get(testServer.baseUrl, '/test/999'));
      expect(error).toContain('Error validating request params');
      await stopTestServer(testServer.server);
    });
  });

  describe('#headers validation', () => {
    test('should successfully validate headers using ArkType', async () => {
      const validator = createValidator();
      const schema = type({
        'x-api-key': 'string',
        'content-type?': 'string',
      });

      const app = createTestApp();
      app.get('/test', validator.headers(schema), (_req, res) => {
        expect(_req.headers['x-api-key']).toBeTypeOf('string');
        res.status(200).end('ok');
      });

      const testServer = await startTestServer(app);
      await expectSuccess(getWithHeaders(testServer.baseUrl, '/test', {}, { 'x-api-key': 'test-key-123' }));
      await stopTestServer(testServer.server);
    });
  });

  describe('error handling with passError option', () => {
    test('should pass error to express error handler when passError is true', async () => {
      const validator = createValidator({ passError: true });
      const schema = type({
        key: 'string',
      });
      const app = createTestApp({ passError: true });

      app.get('/test', validator.query(schema), (_req, res) => {
        res.end('ok');
      });

      const testServer = await startTestServer(app);
      const response = await get(testServer.baseUrl, '/test');
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'validation failed');
      expect(data.details).toHaveProperty('type', 'query');
      expect(data.details).toHaveProperty('issues');
      expect(Array.isArray(data.details.issues)).toBe(true);
      expect(data.details.issues[0]).toHaveProperty('message');
      await stopTestServer(testServer.server);
    });

    test('should use custom status code', async () => {
      const validator = createValidator({ statusCode: 422 });
      const schema = type({
        key: 'string',
      });

      const app = createTestApp();
      app.get('/test', validator.query(schema), (_req, res) => {
        res.end('ok');
      });

      const testServer = await startTestServer(app);
      const response = await get(testServer.baseUrl, '/test');
      expect(response.status).toBe(422);
      await stopTestServer(testServer.server);
    });
  });

  describe('ArkType-specific features', () => {
    test('should validate string constraints', async () => {
      const validator = createValidator();
      const schema = type({
        username: 'string>2<21',
      });

      const app = createTestApp();
      app.post('/test', validator.body(schema), (_req, res) => {
        res.status(200).json(_req.body);
      });

      const testServer = await startTestServer(app);
      const error = await expectValidationError(post(testServer.baseUrl, '/test', { username: 'ab' }));
      expect(error).toContain('Error validating');
      await stopTestServer(testServer.server);
    });

    test('should validate numeric ranges', async () => {
      const validator = createValidator();
      const schema = type({
        age: 'number>17<121',
      });

      const app = createTestApp();
      app.post('/test', validator.body(schema), (_req, res) => {
        res.status(200).json(_req.body);
      });

      const testServer = await startTestServer(app);
      const data = await expectSuccess(post(testServer.baseUrl, '/test', { age: 25 }));
      expect(data.age).toBe(25);
      await stopTestServer(testServer.server);
    });

    test('should validate union types', async () => {
      const validator = createValidator();
      const schema = type({
        status: '"active" | "inactive" | "pending"',
      });

      const app = createTestApp();
      app.post('/test', validator.body(schema), (_req, res) => {
        res.status(200).json(_req.body);
      });

      const testServer = await startTestServer(app);
      const data = await expectSuccess(post(testServer.baseUrl, '/test', { status: 'active' }));
      expect(data.status).toBe('active');
      await stopTestServer(testServer.server);
    });

    test('should fail validation on invalid union value', async () => {
      const validator = createValidator();
      const schema = type({
        status: '"active" | "inactive"',
      });

      const app = createTestApp();
      app.post('/test', validator.body(schema), (_req, res) => {
        res.status(200).json(_req.body);
      });

      const testServer = await startTestServer(app);
      const error = await expectValidationError(post(testServer.baseUrl, '/test', { status: 'unknown' }));
      expect(error).toContain('Error validating');
      await stopTestServer(testServer.server);
    });

    test('should validate array types', async () => {
      const validator = createValidator();
      const schema = type({
        tags: 'string[]',
      });

      const app = createTestApp();
      app.post('/test', validator.body(schema), (_req, res) => {
        expect(_req.body.tags).toBeTypeOf('object');
        expect(_req.body.tags).toHaveLength(3);
        res.status(200).json(_req.body);
      });

      const testServer = await startTestServer(app);
      const data = await expectSuccess(
        post(testServer.baseUrl, '/test', {
          tags: ['typescript', 'nodejs', 'express'],
        }),
      );
      expect(data.tags).toHaveLength(3);
      await stopTestServer(testServer.server);
    });
  });

  describe('response validation', () => {
    test('should validate response data', async () => {
      const validator = createValidator();
      const schema = type({
        id: 'number',
        name: 'string',
      });

      const app = createTestApp();
      app.get('/test', validator.response(schema), (_req, res) => {
        res.json({ id: 1, name: 'Test' });
      });

      const testServer = await startTestServer(app);
      const data = await expectSuccess(get(testServer.baseUrl, '/test'));
      expect(data.id).toBe(1);
      expect(data.name).toBe('Test');
      await stopTestServer(testServer.server);
    });
  });

  describe('originalQuery storage', () => {
    test('should store original query before validation', async () => {
      const validator = createValidator();
      const schema = type({
        age: 'string.numeric.parse',
      });

      const app = createTestApp();
      app.get('/test', validator.query(schema), (_req, res) => {
        expect(_req.originalQuery).toBeDefined();
        // @ts-expect-error - originalQuery is added by middleware
        expect(_req.originalQuery.age).toBe('25');
        expect(_req.query.age).toBe(25);
        res.status(200).end('ok');
      });

      const testServer = await startTestServer(app);
      await expectSuccess(get(testServer.baseUrl, '/test', { age: '25' }));
      await stopTestServer(testServer.server);
    });
  });
});
