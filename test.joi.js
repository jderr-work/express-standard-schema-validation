'use strict'

const Joi = require('joi')
const supertest = require('supertest')
const expect = require('chai').expect
const chance = require('chance').Chance()

describe('express-joi-validation with Joi >= 18.0.0', function() {
  let mod

  beforeEach(function() {
    delete require.cache[require.resolve('../express-joi-validation')]
    mod = require('../express-joi-validation')
  })

  describe('Joi Standard Schema Support', function() {
    it('should validate that Joi schemas implement Standard Schema', function() {
      const joiSchema = Joi.object({
        key: Joi.number().required()
      })

      // Check that Joi 18+ has Standard Schema support
      expect(joiSchema).to.have.property('~standard')
      expect(joiSchema['~standard']).to.have.property('version', 1)
      expect(joiSchema['~standard']).to.have.property('validate')
      expect(joiSchema['~standard'].validate).to.be.a('function')
    })

    it('should throw error for non-Standard Schema objects', function() {
      const validator = mod.createValidator()
      const invalidSchema = { validate: function() {} }

      expect(() => {
        validator.query(invalidSchema)
      }).to.throw(/must implement Standard Schema V1 interface/)
    })
  })

  describe('#query validation', function() {
    it('should successfully validate a query using Joi', function(done) {
      const validator = mod.createValidator()
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number()
          .integer()
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
      const schema = Joi.object({
        name: Joi.string().required()
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
    it('should successfully validate a body using Joi', function(done) {
      const validator = mod.createValidator()
      const schema = Joi.object({
        username: Joi.string().required(),
        email: Joi.string()
          .email()
          .required()
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
      const schema = Joi.object({
        username: Joi.string().required(),
        email: Joi.string()
          .email()
          .required()
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
    it('should successfully validate params using Joi', function(done) {
      const validator = mod.createValidator()
      const schema = Joi.object({
        id: Joi.number()
          .integer()
          .required()
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
      const schema = Joi.object({
        id: Joi.number()
          .integer()
          .min(1)
          .max(100)
          .required()
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
      const schema = Joi.object({
        key: Joi.string().required()
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
})
