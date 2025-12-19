import { describe, test, expect, vi } from 'vitest';
import { createValidator } from './index.js';

describe('createValidator', () => {
  describe('Standard Schema validation', () => {
    test('should throw error for non-Standard Schema objects', () => {
      const validator = createValidator();
      const invalidSchema = { validate: () => {} };

      expect(() => validator.query(invalidSchema)).toThrow(
        'Invalid schema: must implement Standard Schema V1 interface.',
      );
    });

    test('should accept schemas with ~standard property', () => {
      const validator = createValidator();
      const validSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: () => ({ value: {} }),
        },
      };

      expect(() => validator.query(validSchema)).not.toThrow();
    });

    test('should validate Standard Schema V1 interface', () => {
      const validator = createValidator();
      const schema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          // missing validate
        },
      };

      expect(() => validator.query(schema)).toThrow('Invalid schema: must implement Standard Schema V1 interface.');
    });
  });

  describe('Query middleware', () => {
    test('should validate query successfully with valid data', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({
            value: { name: value.name.toUpperCase() },
          }),
        },
      };

      const middleware = validator.query(mockSchema);

      const req = { query: { name: 'john' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query.name).toBe('JOHN');
      expect(req.originalQuery).toEqual({ name: 'john' });
    });

    test('should preserve original query in req.originalQuery', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value }),
        },
      };

      const middleware = validator.query(mockSchema);

      const originalQueryObject = { key: 'value' };
      const req = { query: { ...originalQueryObject } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(req.originalQuery).toEqual(originalQueryObject);
      expect(req.originalQuery).not.toBe(req.query);
    });

    test('should handle type coercion when schema supports it', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({
            value: { age: parseInt(value.age, 10) },
          }),
        },
      };

      const middleware = validator.query(mockSchema);

      const req = { query: { age: '25' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(req.query.age).toBe(25);
      expect(typeof req.query.age).toBe('number');
    });

    test('should call next() on success', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value }),
        },
      };

      const middleware = validator.query(mockSchema);

      const req = { query: { name: 'john' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Body middleware', () => {
    test('should validate body successfully', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value }),
        },
      };

      const middleware = validator.body(mockSchema);

      const req = { body: { name: 'john', age: 30 } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body).toEqual({ name: 'john', age: 30 });
      expect(req.originalBody).toEqual({ name: 'john', age: 30 });
    });

    test('should preserve original body in req.originalBody', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value: { ...value, modified: true } }),
        },
      };

      const middleware = validator.body(mockSchema);

      const req = { body: { name: 'john' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(req.originalBody).toEqual({ name: 'john' });
      expect(req.body).toEqual({ name: 'john', modified: true });
    });

    test('should handle nested objects', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value }),
        },
      };

      const middleware = validator.body(mockSchema);

      const req = { body: { user: { name: 'john', address: { city: 'NYC' } } } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body.user.address.city).toBe('NYC');
    });
  });

  describe('Params middleware', () => {
    test('should validate params successfully', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value: { id: parseInt(value.id, 10) } }),
        },
      };

      const middleware = validator.params(mockSchema);

      const req = { params: { id: '123' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.params.id).toBe(123);
      expect(req.originalParams).toEqual({ id: '123' });
    });

    test('should preserve original params in req.originalParams', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value }),
        },
      };

      const middleware = validator.params(mockSchema);

      const req = { params: { id: '123', name: 'test' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(req.originalParams).toEqual({ id: '123', name: 'test' });
    });

    test('should coerce string params to correct types', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({
            value: { id: Number(value.id), active: value.active === 'true' },
          }),
        },
      };

      const middleware = validator.params(mockSchema);

      const req = { params: { id: '456', active: 'true' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(req.params.id).toBe(456);
      expect(req.params.active).toBe(true);
    });
  });

  describe('Headers middleware', () => {
    test('should validate headers successfully', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value }),
        },
      };

      const middleware = validator.headers(mockSchema);

      const req = { headers: { 'content-type': 'application/json' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.originalHeaders).toEqual({
        'content-type': 'application/json',
      });
    });

    test('should preserve original headers in req.originalHeaders', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value }),
        },
      };

      const middleware = validator.headers(mockSchema);

      const req = { headers: { host: 'localhost', 'user-agent': 'test' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(req.originalHeaders).toEqual({
        host: 'localhost',
        'user-agent': 'test',
      });
    });

    test('should handle case-insensitive header names', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value }),
        },
      };

      const middleware = validator.headers(mockSchema);

      const req = { headers: { 'Content-Type': 'application/json' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Fields middleware', () => {
    test('should validate fields successfully', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value }),
        },
      };

      const middleware = validator.fields(mockSchema);

      const req = { fields: { name: 'john', email: 'john@example.com' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.originalFields).toEqual({
        name: 'john',
        email: 'john@example.com',
      });
    });

    test('should preserve original fields in req.originalFields', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value }),
        },
      };

      const middleware = validator.fields(mockSchema);

      const req = { fields: { username: 'johndoe' } };
      const res = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(req.originalFields).toEqual({ username: 'johndoe' });
    });
  });

  describe('Response middleware', () => {
    let mockSchema: any;
    test('should throw an error if not a standard schema', async () => {
      const validator = createValidator();
      mockSchema = {};

      expect(() => validator.response(mockSchema as any)).toThrow(
        'Invalid schema: must implement Standard Schema V1 interface.',
      );
    });

    test('should validate response data', async () => {
      const validator = createValidator();
      mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => ({ value }),
        },
      };

      const middleware = validator.response(mockSchema);

      const req = {};
      const originalJson = vi.fn().mockImplementation(function (data) {
        this._jsonData = data;
        return this;
      });
      const res = {
        json: originalJson,
        _jsonData: null,
      };
      const next = vi.fn();

      await middleware(req, res, next);

      // After middleware, res.json should be wrapped
      expect(res.json).not.toBe(originalJson);

      // Call the wrapped json method
      await res.json({ message: 'success' });

      // The original json should have been called with the validated data
      expect(originalJson).toHaveBeenCalledWith({ message: 'success' });
    });

    test('should call next when passError is true in global config', async () => {
      const validator = createValidator({ passError: true });
      mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: () => ({ issues: [{ message: 'Invalid' }] }),
        },
      };
      const middleware = validator.response(mockSchema);
      const req = { query: {} };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await middleware(req, res, next);
      res.json();
    });

    test('should call next when passError is true in local config', async () => {
      const validator = createValidator();
      mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: () => ({ issues: [{ message: 'Invalid' }] }),
        },
      };
      const middleware = validator.response(mockSchema, { passError: true });

      const req = { query: {} };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await middleware(req, res, next);
      res.json();
    });

    test('should return error as response if passError is not set', async () => {
      const validator = createValidator();
      mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: () => ({ issues: [{ message: 'Invalid' }] }),
        },
      };
      const middleware = validator.response(mockSchema);
      const req = { query: {} };
      const mockEnd = vi.fn();
      const mockStatus = vi.fn().mockReturnValue({ end: mockEnd });
      const res = {
        status: mockStatus,
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await middleware(req, res, next);
      await res.json();
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockEnd).toHaveBeenCalledWith('Error validating response json. Invalid.');
      expect(next).toHaveBeenCalledWith(); // next wasn't called because we sent response
    });

    test('should call next with an error if an unexpect error is thrown', async () => {
      const validator = createValidator();
      mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: () => {
            throw new Error('Unexpected error');
          },
        },
      };

      const middleware = validator.response(mockSchema);
      const req = { query: {} };
      const res = {
        status: vi.fn(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await middleware(req, res, next);
      await res.json();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('passError configuration', () => {
    describe('Query middleware', () => {
      test('should call next error when passError is true in global config', async () => {
        expect(true).toBe(true);
        const validator = createValidator({ passError: true });
        const mockSchema = {
          '~standard': {
            version: 1,
            vendor: 'test',
            validate: () => ({ issues: [{ message: 'Invalid' }] }),
          },
        };

        validator.query(mockSchema);
        const middleware = validator.query(mockSchema as any);
        const req = { query: {} };
        const res = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
        };
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'query',
            issues: expect.any(Array),
          }),
        );
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
      });

      test('should call next error when passError is true in middleware config', async () => {
        const validator = createValidator();
        const mockSchema = {
          '~standard': {
            version: 1,
            vendor: 'test',
            validate: () => ({ issues: [{ message: 'Invalid' }] }),
          },
        };

        const middleware = validator.query(mockSchema, { passError: true });

        const req = { query: {} };
        const res = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
        };
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'query',
            issues: expect.any(Array),
          }),
        );
        expect(res.status).not.toHaveBeenCalled();
      });

      test('should prefer middleware passError over global passError', async () => {
        const validator = createValidator({ passError: false });
        const mockSchema = {
          '~standard': {
            version: 1,
            vendor: 'test',
            validate: () => ({ issues: [{ message: 'Invalid' }] }),
          },
        };

        const middleware = validator.query(mockSchema, { passError: true });

        const req = { query: {} };
        const res = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
        };
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ type: 'query' }));
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('Async validation', () => {
    test('should handle async schema validation (Promise)', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: async (value) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return { value: { ...value, async: true } };
          },
        },
      };

      const middleware = validator.query(mockSchema);

      const req = { query: { name: 'john' } };
      const res = {};
      const next = vi.fn();

      // Call middleware and wait for next() to be called
      middleware(req, res, next);
      await vi.waitFor(() => {
        expect(next).toHaveBeenCalled();
      });

      expect(next).toHaveBeenCalledWith();
      expect(req.query.async).toBe(true);
    });

    test('should handle validation errors in async schemas', async () => {
      const validator = createValidator({ passError: true });
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return { issues: [{ message: 'async error' }] };
          },
        },
      };

      const middleware = validator.query(mockSchema);

      const req = { query: {} };
      const res = {};
      const next = vi.fn();

      // Call middleware and wait for next() to be called
      middleware(req, res, next);
      await vi.waitFor(() => {
        expect(next).toHaveBeenCalled();
      });

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'query',
          issues: expect.arrayContaining([expect.objectContaining({ message: 'async error' })]),
        }),
      );
    });

    test('should catch unexpected errors in async validation', async () => {
      const validator = createValidator();
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: async () => {
            throw new Error('Unexpected error');
          },
        },
      };

      const middleware = validator.query(mockSchema);

      const req = { query: {} };
      const res = {};
      const next = vi.fn();

      // Call middleware and wait for next() to be called
      middleware(req, res, next);
      await vi.waitFor(() => {
        expect(next).toHaveBeenCalled();
      });

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Unexpected error');
    });
  });

  describe('Configuration precedence', () => {
    test('middleware config statusCode overrides global statusCode', async () => {
      const validator = createValidator({ statusCode: 422 });
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: () => ({ issues: [{ message: 'error' }] }),
        },
      };

      const middleware = validator.query(mockSchema, { statusCode: 400 });

      const req = { query: {} };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('undefined middleware config uses global config', async () => {
      const validator = createValidator({ statusCode: 418, passError: true });
      const mockSchema = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: () => ({ issues: [{ message: 'error' }] }),
        },
      };

      const middleware = validator.query(mockSchema);

      const req = { query: {} };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 418,
        }),
      );
    });
  });
});
