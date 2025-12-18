import { describe, test, expect } from 'vitest';
import Joi from 'joi';
import { createTestApp, startTestServer, stopTestServer } from './setup.js';
import { expectSuccess, expectValidationError, get, post } from './helpers.js';
import { createValidator } from '../express-standard-schema-validation.js';

describe('express-joi-validation with Joi >= 18.0.0', () => {
  describe('Joi Standard Schema Support', () => {
    test('should validate that Joi schemas implement Standard Schema', () => {
      const joiSchema = Joi.object({
        key: Joi.number().required(),
      });

      // Check that Joi 18+ has Standard Schema support
      expect(joiSchema).toHaveProperty('~standard');
      expect(joiSchema['~standard']).toHaveProperty('version', 1);
      expect(joiSchema['~standard']).toHaveProperty('validate');
      expect(joiSchema['~standard'].validate).toBeTypeOf('function');
    });

    test('should throw error for non-Standard Schema objects', () => {
      const validator = createValidator();
      const invalidSchema = { validate: function () {} };

      expect(() => {
        validator.query(invalidSchema);
      }).toThrow(/must implement Standard Schema V1 interface/);
    });
  });

  describe('#query validation', () => {
    test('should successfully validate a query using Joi', async () => {
      const validator = createValidator();
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().integer().min(0),
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
      const schema = Joi.object({
        name: Joi.string().required(),
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
    test('should successfully validate a body using Joi', async () => {
      const validator = createValidator();
      const schema = Joi.object({
        username: Joi.string().required(),
        email: Joi.string().email().required(),
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
      const schema = Joi.object({
        username: Joi.string().required(),
        email: Joi.string().email().required(),
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
    test('should successfully validate params using Joi', async () => {
      const validator = createValidator();
      const schema = Joi.object({
        id: Joi.number().integer().required(),
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
      const schema = Joi.object({
        id: Joi.number().integer().min(1).max(100).required(),
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
      const schema = Joi.object({
        key: Joi.string().required(),
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
});
