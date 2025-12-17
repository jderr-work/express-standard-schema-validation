'use strict'

/**
 * Storage properties for each container type.
 * The original (pre-validation) values are stored in these properties.
 */
const containers = {
  query: {
    storageProperty: 'originalQuery'
  },
  // For use with body-parser
  body: {
    storageProperty: 'originalBody'
  },
  headers: {
    storageProperty: 'originalHeaders'
  },
  // URL params e.g "/users/:userId"
  params: {
    storageProperty: 'originalParams'
  },
  // For use with express-formidable or similar POST body parser for forms
  fields: {
    storageProperty: 'originalFields'
  }
}

/**
 * Checks if a schema implements the Standard Schema V1 interface
 * @param {*} schema - The schema to check
 * @returns {boolean} - True if the schema implements Standard Schema V1
 */
function isStandardSchema(schema) {
  return (
    schema &&
    (typeof schema === 'object' || typeof schema === 'function') &&
    '~standard' in schema &&
    schema['~standard'] &&
    typeof schema['~standard'] === 'object' &&
    typeof schema['~standard'].validate === 'function' &&
    schema['~standard'].version === 1
  )
}

/**
 * Validates that the provided schema implements Standard Schema V1
 * @param {*} schema - The schema to validate
 * @throws {Error} If the schema does not implement Standard Schema V1
 */
function assertStandardSchema(schema) {
  if (!isStandardSchema(schema)) {
    throw new Error(
      'Invalid schema: must implement Standard Schema V1 interface.'
    )
  }
}

/**
 * Builds an error string from Standard Schema validation issues
 * @param {Array} issues - Array of Standard Schema issues
 * @param {string} container - The container being validated (e.g., "query", "body")
 * @returns {string} - Formatted error message
 */
function buildErrorString(issues, container) {
  let ret = `Error validating ${container}.`

  for (let i = 0; i < issues.length; i++) {
    ret += ` ${issues[i].message}.`
  }

  return ret
}

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
        // Use Standard Schema's validate method
        return Promise.resolve(schema['~standard'].validate(req[type]))
          .then(result => {
            if (!result.issues) {
              // Validation succeeded
              req[container.storageProperty] = { ...req[type] }
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
              // Create an error object compatible with the old Joi-based API
              const errorObj = {
                message: buildErrorString(result.issues, `request ${type}`),
                details: result.issues,
                isJoi: true // For backward compatibility with old error handlers
              }

              const err = {
                type: type,
                error: errorObj,
                value: req[type],
                issues: result.issues,
                statusCode: opts.statusCode || cfg.statusCode || 400
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
    // Validate that the schema implements Standard Schema
    assertStandardSchema(schema)

    const type = 'response'
    return (req, res, next) => {
      const resJson = res.json.bind(res)
      res.json = validateJson
      next()

      function validateJson(json) {
        return Promise.resolve(schema['~standard'].validate(json))
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
