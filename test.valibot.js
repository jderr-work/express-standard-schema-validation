'use strict'

const v = require('valibot')
const supertest = require('supertest')
const expect = require('chai').expect
const chance = require('chance').Chance()

describe('express-standard-schema-validation with Valibot >= 1.0.0', function() {
  let mod

  beforeEach(function() {
    delete require.cache[
      require.resolve('./express-standard-schema-validation')
    ]
    mod = require('./express-standard-schema-validation')
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
        age: v.optional(
          v.pipe(
            v.string(),
            v.transform(Number),
            v.number()
          )
        )
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.query.name).to.be.a('string')
        if (req.query.age !== undefined) {
          expect(req.query.age).to.be.a('number')
        }
        res.status(200).json(req.query)
      })

      supertest(app)
        .get('/test?name=John')
        .expect(200)
        .end(done)
    })

    it('should coerce string to number in query', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        name: v.string(),
        age: v.pipe(
          v.string(),
          v.transform(Number),
          v.number()
        )
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.query.name).to.equal('John')
        expect(req.query.age).to.equal(25)
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
        name: v.string(),
        age: v.number()
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

    it('should validate nested objects', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        user: v.object({
          name: v.string(),
          age: v.number()
        })
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        expect(req.body.user.name).to.equal('John')
        expect(req.body.user.age).to.equal(30)
        res.status(200).json(req.body)
      })

      supertest(app)
        .post('/test')
        .send({ user: { name: 'John', age: 30 } })
        .expect(200)
        .end(done)
    })
  })

  describe('#params validation', function() {
    it('should successfully validate params using Valibot', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        id: v.pipe(
          v.string(),
          v.transform(Number),
          v.number()
        )
      })

      const app = require('express')()
      app.get('/test/:id', validator.params(schema), (req, res) => {
        expect(req.params.id).to.be.a('number')
        expect(req.params.id).to.equal(123)
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

  describe('#headers validation', function() {
    it('should successfully validate headers using Valibot', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        'x-api-key': v.string(),
        'content-type': v.optional(v.string())
      })

      const app = require('express')()
      app.get('/test', validator.headers(schema), (req, res) => {
        expect(req.headers['x-api-key']).to.be.a('string')
        res.status(200).end('ok')
      })

      supertest(app)
        .get('/test')
        .set('x-api-key', 'test-key-123')
        .expect(200)
        .end(done)
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

    it('should use custom status code', function(done) {
      const validator = mod.createValidator({ statusCode: 422 })
      const schema = v.object({
        key: v.string()
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        res.end('ok')
      })

      supertest(app)
        .get('/test')
        .expect(422)
        .end(done)
    })
  })

  describe('Valibot-specific features', function() {
    it('should validate string constraints using pipes', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        username: v.pipe(
          v.string(),
          v.minLength(3),
          v.maxLength(20)
        )
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        res.status(200).json(req.body)
      })

      supertest(app)
        .post('/test')
        .send({ username: 'ab' })
        .expect(400)
        .end(done)
    })

    it('should validate numeric ranges', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        age: v.pipe(
          v.number(),
          v.minValue(18),
          v.maxValue(120)
        )
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        res.status(200).json(req.body)
      })

      supertest(app)
        .post('/test')
        .send({ age: 25 })
        .expect(200)
        .end(done)
    })

    it('should validate union types', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        status: v.union([
          v.literal('active'),
          v.literal('inactive'),
          v.literal('pending')
        ])
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        res.status(200).json(req.body)
      })

      supertest(app)
        .post('/test')
        .send({ status: 'active' })
        .expect(200)
        .end(done)
    })

    it('should fail validation on invalid union value', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        status: v.union([v.literal('active'), v.literal('inactive')])
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        res.status(200).json(req.body)
      })

      supertest(app)
        .post('/test')
        .send({ status: 'unknown' })
        .expect(400)
        .end(done)
    })

    it('should validate array types', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        tags: v.array(v.string())
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        expect(req.body.tags).to.be.an('array')
        expect(req.body.tags).to.have.lengthOf(3)
        res.status(200).json(req.body)
      })

      supertest(app)
        .post('/test')
        .send({ tags: ['typescript', 'nodejs', 'express'] })
        .expect(200)
        .end(done)
    })

    it('should handle strict vs loose objects', function(done) {
      const validator = mod.createValidator()
      // strictObject will reject extra properties
      const schema = v.strictObject({
        name: v.string()
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        res.status(200).json(req.body)
      })

      supertest(app)
        .post('/test')
        .send({ name: 'John', extra: 'value' })
        .expect(400)
        .end(done)
    })

    it('should allow extra properties with looseObject', function(done) {
      const validator = mod.createValidator()
      // looseObject will allow extra properties
      const schema = v.looseObject({
        name: v.string()
      })

      const app = require('express')()
      app.use(require('body-parser').json())
      app.post('/test', validator.body(schema), (req, res) => {
        expect(req.body.name).to.equal('John')
        expect(req.body.extra).to.equal('value')
        res.status(200).json(req.body)
      })

      supertest(app)
        .post('/test')
        .send({ name: 'John', extra: 'value' })
        .expect(200)
        .end(done)
    })
  })

  describe('response validation', function() {
    it('should validate response data', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        id: v.number(),
        name: v.string()
      })

      const app = require('express')()
      app.get('/test', validator.response(schema), (req, res) => {
        res.json({ id: 1, name: 'Test' })
      })

      supertest(app)
        .get('/test')
        .expect(200)
        .end((err, res) => {
          expect(res.body.id).to.equal(1)
          expect(res.body.name).to.equal('Test')
          done()
        })
    })
  })

  describe('originalQuery storage', function() {
    it('should store original query before validation', function(done) {
      const validator = mod.createValidator()
      const schema = v.object({
        age: v.pipe(
          v.string(),
          v.transform(Number),
          v.number()
        )
      })

      const app = require('express')()
      app.get('/test', validator.query(schema), (req, res) => {
        expect(req.originalQuery).to.exist
        expect(req.originalQuery.age).to.equal('25')
        expect(req.query.age).to.equal(25)
        res.status(200).end('ok')
      })

      supertest(app)
        .get('/test?age=25')
        .expect(200)
        .end(done)
    })
  })
})
