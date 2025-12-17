'use strict'

const port = 3030

import express from 'express'
import * as Joi from 'joi'
import HelloWorld from './route'
import {
  createValidator,
  ExpressValidatorError
} from '../../express-standard-schema-validation'

const app = express()
const validator = createValidator()

const headerSchema = Joi.object({
  host: Joi.string().required(),
  'user-agent': Joi.string().required()
})

// Validate headers for all incoming requests
app.use(validator.headers(headerSchema))

// No extra validations performed on this simple ping endpoint
app.get('/ping', (req, res) => {
  res.end('pong')
})

app.use('/hello', HelloWorld)

// Custom error handler
app.use(
  (
    err: any | ExpressValidatorError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err && err.type && err.issues) {
      const e: ExpressValidatorError = err
      // e.g "you submitted a bad query"
      res.status(400).end(`You submitted a bad ${e.type} parameter.`)
    } else {
      res.status(500).end('internal server error')
    }
  }
)

app.listen(port, () => {
  console.log(`\napp started on ${port}\n`)
  console.log(
    `Try accessing http://localhost:${port}/ping or http://localhost:${port}/hello?name=dean to get some data.\n`
  )
  console.log(
    `Now try access http://localhost:${port}/hello. You should get an error complaining that your querystring is invalid.`
  )
})
