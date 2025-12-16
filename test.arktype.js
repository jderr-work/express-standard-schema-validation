'use strict'

const { type } = require('arktype')
const supertest = require('supertest')
const expect = require('chai').expect
const chance = require('chance').Chance()

describe('express-joi-validation with Arktype >= 2.0.0-beta', function() {
  let mod

  beforeEach(function() {
    delete require.cache[require.resolve('../express-joi-validation')]
    mod = require('../express-joi-validation')
  })

  describe('Arktype Standard Schema Support', function() {
    it('should validate that Arktype schemas implement Standard Schema', function() {
      const arktypeSchema = type({
        key: 'number'
      })

      // Check that Arktype has Standard Schema support
      expect(arktypeSchema).to.have.property('~standard')
      expect(arktypeSchema['~standard']).to.have.property('version', 1)
      expect(arktypeSchema['~standard']).to.have.property('validate')
      expect(arktypeSchema['~standard'].validate).to.be.a('function')
    })
  })

  describe('#query validation', function() {
    it('should successfully validate a query using Arktype', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        name: 'string',
        'age?': 'number'
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.query.name).to.be.a('string')
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?name=John')
        .expect(200)
        .end(done)
    })

    it('should fail validation with invalid query', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        name: 'string'
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
    it('should successfully validate a body using Arktype', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        username: 'string',
        email: 'string.email'
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
      const schema = type({
        username: 'string',
        email: 'string.email'
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
    it('should successfully validate params using Arktype', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        id: 'string'
      })

      const app = require('express')()
      app.get('/test/:id', validator.params(schema), (req, res) => {
        expect(req.params.id).to.be.a('string')
        res.status(200).json(req.params)
      })

      supertest(app)
        .get('/test/123')
        .expect(200)
        .end(done)
    })

    it('should fail validation with invalid params', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        id: 'number'
      })

      const app = require('express')()
      app.get('/test/:id', validator.params(schema), (req, res) => {
        res.status(200).end('ok')
      })

      supertest(app)
        .get('/test/abc')
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
      const schema = type({
        key: 'string'
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

  describe('Arktype-specific behavior', function() {
    it('should handle type unions', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        status: '"pending" | "active" | "completed"'
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.query.status).to.be.oneOf(['pending', 'active', 'completed'])
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?status=active')
        .expect(200)
        .end(done)
    })

    it('should fail with invalid union value', function(done) {
      const validator = mod.createValidator()
      const schema = type({
        status: '"pending" | "active" | "completed"'
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        res.status(200).end('ok')
      })

      supertest(app)
        .get('/test?status=invalid')
        .expect(400)
        .end((err, res) => {
          expect(res.text).to.contain('Error validating')
          done()
        })
    })
  })
})
