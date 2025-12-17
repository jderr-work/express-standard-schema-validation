'use strict'

const express = require('express')
const bodyParser = require('body-parser')

/**
 * Creates an Express app with optional error handling configuration
 *
 * @param {{passError?: boolean}} options
 * @returns {express.Application}
 */
function createTestApp(options = {}) {
  const app = express()
  app.use(bodyParser.json())

  // Global error handler for passError tests - MUST be after routes
  if (options.passError) {
    // Store a flag so we know to add error handler after routes
    app.set('needsErrorHandler', true)
  }

  return app
}

/**
 * Starts a test server on random available port
 * Adds error handler if needed (must be after all routes are added)
 *
 * @param {express.Application} app
 * @returns {Promise<{server: http.Server, port: number, baseUrl: string}>}
 */
async function startTestServer(app) {
  // Add error handler AFTER all routes have been added
  if (app.get('needsErrorHandler')) {
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 400).json({
        error: 'validation failed',
        details: {
          type: err.type,
          issues: err.issues
        }
      })
    })
  }

  return new Promise(resolve => {
    const server = app.listen(0, () => {
      const port = server.address().port
      resolve({
        server,
        port,
        baseUrl: `http://localhost:${port}`
      })
    })
  })
}

/**
 * Stops a test server
 *
 * @param {http.Server} server
 * @returns {Promise<void>}
 */
function stopTestServer(server) {
  return new Promise((resolve, reject) => {
    server.close(err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

module.exports = {
  createTestApp,
  startTestServer,
  stopTestServer
}
