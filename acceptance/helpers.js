/**
 * Assert successful response and return parsed JSON or text
 *
 * @param {Promise<Response>|Response} response
 * @param {number} expectedStatus
 * @returns {Promise<any>}
 */
export async function expectSuccess(response, expectedStatus = 200) {
  response = await response
  if (response.status !== expectedStatus) {
    const text = await response.text()
    throw new Error(
      `Expected status ${expectedStatus}, got ${
        response.status
      }. Response: ${text}`
    )
  }
  // Try to parse as JSON, fall back to text
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

/**
 * Assert validation error response
 *
 * @param {Promise<Response>|Response} response
 * @param {number} expectedStatus
 * @returns {Promise<string>}
 */
export async function expectValidationError(response, expectedStatus = 400) {
  response = await response
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`)
  }
  const text = await response.text()
  if (!text.includes('Error validating request')) {
    throw new Error(
      `Response does not contain 'Error validating request': ${text}`
    )
  }
  return text
}

/**
 * Make GET request with query params
 *
 * @param {string} baseUrl
 * @param {string} path
 * @param {Object} params
 * @returns {Promise<Response>}
 */
export async function get(baseUrl, path, params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const fullUrl = queryString
    ? `${baseUrl}${path}?${queryString}`
    : `${baseUrl}${path}`
  return fetch(fullUrl)
}

/**
 * Make POST request with JSON body
 *
 * @param {string} baseUrl
 * @param {string} path
 * @param {Object} body
 * @returns {Promise<Response>}
 */
export async function post(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

/**
 * Make GET request with custom headers
 *
 * @param {string} baseUrl
 * @param {string} path
 * @param {Object} params
 * @param {Object} headers
 * @returns {Promise<Response>}
 */
export async function getWithHeaders(baseUrl, path, params = {}, headers = {}) {
  const queryString = new URLSearchParams(params).toString()
  const fullUrl = queryString
    ? `${baseUrl}${path}?${queryString}`
    : `${baseUrl}${path}`
  return fetch(fullUrl, { headers })
}

/**
 * Make POST request with form data (multipart/form-data)
 *
 * @param {string} baseUrl
 * @param {string} path
 * @param {Object} fields
 * @returns {Promise<Response>}
 */
export async function postFormData(baseUrl, path, fields) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value)
  }
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    body: formData
  })
}
