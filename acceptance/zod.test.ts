import { describe, test, expect } from 'vitest';
import { z } from 'zod';
import { createTestApp, startTestServer, stopTestServer } from './setup.js';
import { expectSuccess, expectValidationError, get, post } from './helpers.js';
import { createValidator } from '../dist/index.js';

describe('express-joi-validation with Zod >= 3.23', () => {
  describe('Zod Standard Schema Support', () => {
    test('should validate that Zod schemas implement Standard Schema', () => {
      const zodSchema = z.object({
        key: z.number(),
      });

      // Check that Zod 3.23+ has Standard Schema support
      expect(zodSchema).toHaveProperty('~standard');
      expect(zodSchema['~standard']).toHaveProperty('version', 1);
      expect(zodSchema['~standard']).toHaveProperty('validate');
      expect(zodSchema['~standard'].validate).toBeTypeOf('function');
    });
  });

  describe('#query validation', () => {
    test('should successfully validate a query using Zod', async () => {
      const validator = createValidator();
      const schema = z.object({
        name: z.string(),
        age: z.coerce.number().int().min(0),
      });

      const app = createTestApp();
      app.get('/test', validator.query(schema), (_req, res) => {
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
      const schema = z.object({
        name: z.string(),
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
    test('should successfully validate a body using Zod', async () => {
      const validator = createValidator();
      const schema = z.object({
        username: z.string(),
        email: z.string().email(),
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
      const schema = z.object({
        username: z.string(),
        email: z.string().email(),
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
  });

  describe('#params validation', () => {
    test('should successfully validate params using Zod', async () => {
      const validator = createValidator();
      const schema = z.object({
        id: z.coerce.number().int(),
      });

      const app = createTestApp();
      app.get('/test/:id', validator.params(schema), (_req, res) => {
        res.status(200).json(_req.params);
      });

      const testServer = await startTestServer(app);
      const data = await expectSuccess(get(testServer.baseUrl, '/test/123'));
      expect(data.id).toBe(123);
      await stopTestServer(testServer.server);
    });

    test('should fail validation with invalid params', async () => {
      const validator = createValidator();
      const schema = z.object({
        id: z.coerce.number().int().min(1).max(100),
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

  describe('error handling with passError option', () => {
    test('should pass error to express error handler when passError is true', async () => {
      const validator = createValidator({ passError: true });
      const schema = z.object({
        key: z.string(),
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
  });

  describe('Zod-specific behavior', () => {
    test('should handle strict vs passthrough schemas', async () => {
      const validator = createValidator();
      // Zod is strict by default - extra properties cause errors
      const schema = z
        .object({
          name: z.string(),
        })
        .strict();

      const app = createTestApp();
      app.get('/test', validator.query(schema), (_req, res) => {
        res.status(200).json(_req.query);
      });

      const testServer = await startTestServer(app);
      const error = await expectValidationError(get(testServer.baseUrl, '/test', { name: 'John', extra: 'value' }));
      expect(error).toContain('Error validating');
      await stopTestServer(testServer.server);
    });

    test('should allow passthrough for extra properties', async () => {
      const validator = createValidator();
      const schema = z
        .object({
          name: z.string(),
        })
        .passthrough();

      const app = createTestApp();
      app.get('/test', validator.query(schema), (_req, res) => {
        expect(_req.query.name).toBe('John');
        expect(_req.query.extra).toBe('value');
        res.status(200).json(_req.query);
      });

      const testServer = await startTestServer(app);
      const data = await expectSuccess(get(testServer.baseUrl, '/test', { name: 'John', extra: 'value' }));
      expect(data.name).toBe('John');
      expect(data.extra).toBe('value');
      await stopTestServer(testServer.server);
    });
  });
});
