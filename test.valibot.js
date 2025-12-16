'use strict'

const v = require('valibot')
const supertest = require('supertest')
const expect = require('chai').expect
const chance = require('chance').Chance()

describe('express-joi-validation with Valibot >= 0.31.0', function() {
  let mod

  beforeEach(function() {
    delete require.cache[require.resolve('../express-joi-validation')]
    mod = require('../express-joi-validation')
  })

  describe('Valibot Standard Schema Support', function() {
    it('should validate that Valibot schemas implement Standard Schema', function() {
      const valibotSchema = v.object({
        key: v.number()
      })

      // Check that Valibot 0.31+ has Standard Schema support
      expect(valibotSchema).to.have.property('~standard')
      expect(valibotSchema['~standard']).to.have.property('version', 1)
      expect(valibotSchema['~standard']).to.have.property('validate')
      expect(valibotSchema['~standard'].validate).to.be.a('function')
    })
  })

  describe('#query validation', function() {
    it('should successfully validate a query using Valibot', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        name: v.string(),
        age: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.integer(),
          v.minValue(0)
        )
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
      const schema = v.object({
        name: v.string()
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
    it('should successfully validate a body using Valibot', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        username: v.string(),
        email: v.pipe(
          v.string(),
          v.email()
        )
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
      const schema = v.object({
        username: v.string(),
        email: v.pipe(
          v.string(),
          v.email()
        )
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
    it('should successfully validate params using Valibot', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        id: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.integer()
        )
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
      const schema = v.object({
        id: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.integer(),
          v.minValue(1),
          v.maxValue(100)
        )
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
      const schema = v.object({
        key: v.string()
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

  describe('Valibot-specific behavior', function() {
    it('should handle strict vs loose objects', function(done) {
      const validator = mod.createValidator()
      // Use looseObject to allow extra properties
      const schema = v.looseObject({
        name: v.string()
      })

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
