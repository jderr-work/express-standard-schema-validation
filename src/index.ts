import { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  StandardSchemaV1,
  ExpressValidatorConfig,
  ExpressValidatorContainerConfig,
  ExpressValidatorInstance,
  ContainerTypes,
} from './types.js';
import { containers } from './constants.js';
import { isStandardSchema, buildErrorString } from './utils.js';

/**
 * Creates a validator instance that generates Express middleware for Standard Schema validation
 * @param cfg - Configuration options
 * @param cfg.passError - Whether to pass validation errors to Express error handler
 * @param cfg.statusCode - Default status code for validation failures
 * @returns Validator instance with middleware generator methods
 */
export const createValidator = (cfg: ExpressValidatorConfig = {}): ExpressValidatorInstance => {
  /**
   * Response validation middleware
   * @param schema - Standard Schema V1 compatible schema
   * @param opts - Options for this middleware
   * @returns Express middleware function
   */
  const response = <T extends StandardSchemaV1>(
    schema: T,
    opts: ExpressValidatorContainerConfig = {},
  ): RequestHandler => {
    // Validate that the schema implements Standard Schema
    if (!isStandardSchema(schema)) {
      throw new Error('Invalid schema: must implement Standard Schema V1 interface.');
    }

    const type = 'response';
    return (_req: Request, res: Response, next: NextFunction): void => {
      const resJson = res.json.bind(res);
      const validateJson = async (json: unknown): Promise<Response | void> => {
        try {
          const result = await schema['~standard'].validate(json);
          if (!result.issues) {
            // Validation succeeded - return validated value
            return resJson(result.value);
          } else if (opts.passError || cfg.passError) {
            // Pass error to express error handler
            const err = {
              type: type,
              issues: result.issues,
            };
            next(err);
            return undefined;
          } else {
            // Return error as response
            res.status(opts.statusCode || cfg.statusCode || 500).end(buildErrorString(result.issues, `${type} json`));
            return undefined;
          }
        } catch (err) {
          // Handle any unexpected errors during validation
          next(err);
          return undefined;
        }
      };

      res.json = validateJson as any;
      next();
    };
  };

  // We'll return this instance of the middleware
  const instance: ExpressValidatorInstance = {
    response,
  } as ExpressValidatorInstance;

  // Generate middleware for each container type
  Object.keys(containers).forEach((type) => {
    const containerType = type as ContainerTypes;
    const container = containers[containerType];

    (instance as any)[type] = <T extends StandardSchemaV1>(
      schema: T,
      opts: ExpressValidatorContainerConfig = {},
    ): RequestHandler => {
      // Validate that the schema implements Standard Schema
      if (!isStandardSchema(schema)) {
        throw new Error('Invalid schema: must implement Standard Schema V1 interface.');
      }

      return (req: Request, res: Response, next: NextFunction): void => {
        // Use Standard Schema's validate method
        Promise.resolve(schema['~standard'].validate((req as any)[type]))
          .then((result) => {
            if (!result.issues) {
              // Validation succeeded
              (req as any)[container.storageProperty] = { ...(req as any)[type] };
              const descriptor = Object.getOwnPropertyDescriptor(req, type);
              if (descriptor && descriptor.writable) {
                (req as any)[type] = result.value;
              } else {
                Object.defineProperty(req, type, {
                  get() {
                    return result.value;
                  },
                });
              }
              next();
            } else if (opts.passError || cfg.passError) {
              // Pass error to express error handler
              // Create an error object with validation details
              const errorObj = {
                message: buildErrorString(result.issues, `request ${type}`),
                details: result.issues,
              };

              const err = {
                type: type,
                error: errorObj,
                value: (req as any)[type],
                issues: result.issues,
                statusCode: opts.statusCode || cfg.statusCode || 400,
              };
              next(err);
            } else {
              // Return error as response
              res
                .status(opts.statusCode || cfg.statusCode || 400)
                .end(buildErrorString(result.issues, `request ${type}`));
            }
          })
          .catch((err) => {
            // Handle any unexpected errors during validation
            next(err);
          });
      };
    };
  });

  return instance;
};

// Re-export types for convenience
export * from './types.js';
