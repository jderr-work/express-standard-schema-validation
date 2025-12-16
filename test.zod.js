'use strict'

const { z } = require('zod')
const supertest = require('supertest')
const expect = require('chai').expect
const chance = require('chance').Chance()

describe('express-joi-validation with Zod >= 3.23', function() {
  let mod

  beforeEach(function() {
    delete require.cache[require.resolve('../express-joi-validation')]
    mod = require('../express-joi-validation')
  })

  describe('Zod Standard Schema Support', function() {
    it('should validate that Zod schemas implement Standard Schema', function() {
      const zodSchema = z.object({
        key: z.number()
      })

      // Check that Zod 3.23+ has Standard Schema support
      expect(zodSchema).to.have.property('~standard')
      expect(zodSchema['~standard']).to.have.property('version', 1)
      expect(zodSchema['~standard']).to.have.property('validate')
      expect(zodSchema['~standard'].validate).to.be.a('function')
    })
  })

  describe('#query validation', function() {
    it('should successfully validate a query using Zod', function(done) {
      const validator = mod.createValidator()
      const schema = z.object({
        name: z.string(),
        age: z.coerce
          .number()
          .int()
          .min(0)
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.query.name).to.be.a('string')
        expect(req.query.age).to.be.a('number')
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?name=John&age=25')
        .expect(200)
        .end(done)
    })

    it('should fail validation with invalid query', function(done) {
      const validator = mod.createValidator()
      const schema = z.object({
        name: z.string()
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        res.status(200).end('ok')
      })

      supertest(app)
        .get('/test')
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating request query')
          done()
        })
    })
  })

  describe('#body validation', function() {
    it('should successfully validate a body using Zod', function(done) {
      const validator = mod.createValidator()
      const schema = z.object({
        username: z.string(),
        email: z.string().email()
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        expect(req.body.username).to.be.a('string')
        expect(req.body.email).to.be.a('string')
        res.status(200).json(req.body)
      })

      supertest(app)
        .post('/test')
        .send({ username: 'john', email: 'john@example.com' })
        .expect(200)
        .end(done)
    })

    it('should fail validation with invalid body', function(done) {
      const validator = mod.createValidator()
      const schema = z.object({
        username: z.string(),
        email: z.string().email()
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        res.status(200).end('ok')
      })

      supertest(app)
        .post('/test')
        .send({ username: 'john', email: 'not-an-email' })
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating request body')
          done()
        })
    })
  })

  describe('#params validation', function() {
    it('should successfully validate params using Zod', function(done) {
      const validator = mod.createValidator()
      const schema = z.object({
        id: z.coerce.number().int()
      })

      const app = require('express')()
      app.get('/test/:id', validator.params(schema), (req, res) => {
        expect(req.params.id).to.be.a('number')
        res.status(200).json(req.params)
      })

      supertest(app)
        .get('/test/123')
        .expect(200)
        .end(done)
    })

    it('should fail validation with invalid params', function(done) {
      const validator = mod.createValidator()
      const schema = z.object({
        id: z.coerce
          .number()
          .int()
          .min(1)
          .max(100)
      })

      const app = require('express')()
      app.get('/test/:id', validator.params(schema), (req, res) => {
        res.status(200).end('ok')
      })

      supertest(app)
        .get('/test/999')
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating request params')
          done()
        })
    })
  })

  describe('error handling with passError option', function() {
    it('should pass error to express error handler when passError is true', function(done) {
      const validator = mod.createValidator({ passError: true })
      const schema = z.object({
        key: z.string()
      })
      const app = require('express')()

      app.get('/test', validator.query(schema), (req, res) => {
        res.end('ok')
      })

      app.use((err, req, res, next) => {
        expect(err).to.have.property('type', 'query')
        expect(err).to.have.property('issues')
        expect(err.issues).to.be.an('array')
        expect(err.issues[0]).to.have.property('message')
        res.status(400).json({ error: 'validation failed' })
      })

      supertest(app)
        .get('/test')
        .expect(400)
        .end((err, res) => {
          expect(res.body).to.have.property('error', 'validation failed')
          done()
        })
    })
  })

  describe('Zod-specific behavior', function() {
    it('should handle strict vs passthrough schemas', function(done) {
      const validator = mod.createValidator()
      // Zod is strict by default - extra properties cause errors
      const schema = z
        .object({
          name: z.string()
        })
        .strict()

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?name=John&extra=value')
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating')
          done()
        })
    })

    it('should allow passthrough for extra properties', function(done) {
      const validator = mod.createValidator()
      const schema = z
        .object({
          name: z.string()
        })
        .passthrough()

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.query.name).to.equal('John')
        expect(req.query.extra).to.equal('value')
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?name=John&extra=value')
        .expect(200)
        .end(done)
    })
  })
})
