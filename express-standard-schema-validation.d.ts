import * as express from 'express'
import { IncomingHttpHeaders } from 'http'
import { ParsedQs } from 'qs'

// Standard Schema V1 types
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaV1.Props<Input, Output>
}

export declare namespace StandardSchemaV1 {
  export interface Props<Input = unknown, Output = Input> {
    readonly version: 1
    readonly vendor: string
    readonly validate: (
      value: unknown,
      options?: StandardSchemaV1.Options | undefined
    ) => Result<Output> | Promise<Result<Output>>
    readonly types?: Types<Input, Output> | undefined
  }

  export type Result<Output> = SuccessResult<Output> | FailureResult

  export interface SuccessResult<Output> {
    readonly value: Output
    readonly issues?: undefined
  }

  export interface FailureResult {
    readonly issues: ReadonlyArray<Issue>
  }

  export interface Issue {
    readonly message: string
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined
  }

  export interface PathSegment {
    readonly key: PropertyKey
  }

  export interface Options {
    readonly libraryOptions?: Record<string, unknown> | undefined
  }

  export interface Types<Input = unknown, Output = Input> {
    readonly input: Input
    readonly output: Output
  }

  export type InferInput<Schema extends StandardSchemaV1> = NonNullable<
    Schema['~standard']['types']
  >['input']

  export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
    Schema['~standard']['types']
  >['output']
}

/**
 * Creates an instance of this module that can be used to generate middleware
 * @param cfg - Configuration options
 */
export function createValidator(
  cfg?: ExpressValidatorConfig
): ExpressValidatorInstance

/**
 * These are the named properties on an express.Request that this module can
 * validate, e.g "body" or "query"
 */
export enum ContainerTypes {
  Body = 'body',
  Query = 'query',
  Headers = 'headers',
  Fields = 'fields',
  Params = 'params'
}

/**
 * Use this in your express error handler if you've set *passError* to true
 * when calling *createValidator*
 */
export interface ExpressValidatorError {
  type: ContainerTypes
  issues: ReadonlyArray<StandardSchemaV1.Issue>
}

/**
 * A schema that developers should extend to strongly type the properties
 * (query, body, etc.) of incoming express.Request passed to a request handler.
 */
export type ValidatedRequestSchema = Record<ContainerTypes, any>

/**
 * Use this in conjunction with *ValidatedRequestSchema* instead of
 * express.Request for route handlers. This ensures *req.query*,
 * *req.body* and others are strongly typed using your
 * *ValidatedRequestSchema*
 */
export interface ValidatedRequest<T extends ValidatedRequestSchema>
  extends express.Request {
  body: T[ContainerTypes.Body]
  query: T[ContainerTypes.Query] & ParsedQs
  headers: T[ContainerTypes.Headers]
  params: T[ContainerTypes.Params]
}

/**
 * Use this in conjunction with *ValidatedRequestSchema* instead of
 * express.Request for route handlers. This ensures *req.query*,
 * *req.body* and others are strongly typed using your *ValidatedRequestSchema*
 *
 * This will also allow you to access the original body, params, etc. as they
 * were before validation.
 */
export interface ValidatedRequestWithRawInputsAndFields<
  T extends ValidatedRequestSchema
> extends express.Request {
  body: T[ContainerTypes.Body]
  query: T[ContainerTypes.Query]
  headers: T[ContainerTypes.Headers]
  params: T[ContainerTypes.Params]
  fields: T[ContainerTypes.Fields]
  originalBody: any
  originalQuery: any
  originalHeaders: IncomingHttpHeaders
  originalParams: any
  originalFields: any
}

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

/**
 * A validator instance that can be used to generate middleware. Is returned by
 * calling *createValidator*
 */
export interface ExpressValidatorInstance {
  body<T extends StandardSchemaV1>(
    schema: T,
    cfg?: ExpressValidatorContainerConfig
  ): express.RequestHandler
  query<T extends StandardSchemaV1>(
    schema: T,
    cfg?: ExpressValidatorContainerConfig
  ): express.RequestHandler
  params<T extends StandardSchemaV1>(
    schema: T,
    cfg?: ExpressValidatorContainerConfig
  ): express.RequestHandler
  headers<T extends StandardSchemaV1>(
    schema: T,
    cfg?: ExpressValidatorContainerConfig
  ): express.RequestHandler
  fields<T extends StandardSchemaV1>(
    schema: T,
    cfg?: ExpressValidatorContainerConfig
  ): express.RequestHandler
  response<T extends StandardSchemaV1>(
    schema: T,
    cfg?: ExpressValidatorContainerConfig
  ): express.RequestHandler
}
