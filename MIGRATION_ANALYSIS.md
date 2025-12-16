# Migration from Joi-Only to Standard Schema Support

## Joi-Specific Implementation Details & Proposed Solutions

### 1. **Unknown Fields Handling**

#### Current Joi Behavior:

```javascript
headers: {
  joi: {
    allowUnknown: true,
    stripUnknown: false
  }
}
```

#### Problem:

- **Joi**: `allowUnknown` and `stripUnknown` control whether extra properties are allowed/removed
- **Zod**: Uses `.passthrough()`, `.strict()`, or `.strip()` methods on the schema itself
- **Valibot**: Uses `object()` with specific behavior, or `looseObject()`, `strictObject()`
- **Arktype**: Properties are strict by default, uses index signatures for additional properties

#### Proposed Solutions:

**Option A: Remove These Options Entirely**

- Let each library handle this via their schema definition
- Document that users should configure this in their schemas
- Example:

  ```javascript
  // Joi
  const schema = Joi.object({ name: Joi.string() }).unknown(true)

  // Zod
  const schema = z.object({ name: z.string() }).passthrough()

  // Valibot
  const schema = v.looseObject({ name: v.string() })
  ```

**Option B: Pass Options as libraryOptions**

- Keep the options but document they're library-specific
- Libraries that don't support them will ignore them
- Risk: Silent failures if users expect behavior that doesn't work

**Recommendation**: Option A - Move responsibility to schema definition

---

### 2. **Type Conversion/Coercion**

#### Current Joi Behavior:

```javascript
query: {
  joi: {
    convert: true // Coerce "123" -> 123
  }
}
```

#### Problem:

- **Joi**: `convert` option coerces types automatically
- **Zod**: Requires explicit `.coerce.number()`, `.coerce.boolean()`, etc.
- **Valibot**: Uses transformation pipelines with `transform()`
- **Arktype**: Type coercion via union types and morphs

#### Proposed Solutions:

**Option A: Remove `convert` Option**

- Users define coercion in their schemas
- Example:

  ```javascript
  // Joi - built-in
  Joi.number()

  // Zod - explicit coercion
  z.coerce.number()

  // Valibot - with transformation
  v.pipe(v.string(), v.transform(Number))
  ```

**Option B: Pass to libraryOptions, Document Behavior**

- Keep option but clearly document it only affects certain libraries
- Risk of confusion

**Recommendation**: Option A - Each library handles coercion via schema definition

---

### 3. **Abort Early Behavior**

#### Current Joi Behavior:

```javascript
body: {
  joi: {
    abortEarly: false // Return all errors
  }
}
```

#### Problem:

- **Joi**: `abortEarly: false` returns all validation errors
- **Zod**: Always returns all errors by default
- **Valibot**: Can configure with `abortEarly` option
- **Arktype**: Returns all errors by default

#### Proposed Solutions:

**Option A: Remove This Option**

- Most libraries return all errors by default anyway
- Simpler API

**Option B: Keep as libraryOptions**

- Pass through for libraries that support it
- Document behavior varies

**Recommendation**: Option A - Remove the option, document that Standard Schema returns all issues

---

### 4. **Error Format**

#### Current Joi Behavior:

```javascript
{
  error: {
    isJoi: true,
    details: [
      { message: "...", path: [...], type: "..." }
    ]
  }
}
```

#### Standard Schema Format:

```javascript
{
  issues: [
    { message: "...", path: [...] }
  ]
}
```

#### Solution:

- ✅ Already standardized in Standard Schema spec
- Update error handler examples to use `issues` instead of `error.details`
- Remove `isJoi` checks

---

### 5. **Validation Options Structure**

#### Current Structure:

```javascript
validator.body(schema, {
  joi: { convert: true, allowUnknown: false },
  passError: true,
  statusCode: 400,
})
```

#### Proposed Structure:

```javascript
validator.body(schema, {
  passError: true,
  statusCode: 400,
  // Library-specific options go in schema definition
})
```

Or with libraryOptions:

```javascript
validator.body(schema, {
  libraryOptions: {
    /* library-specific */
  },
  passError: true,
  statusCode: 400,
})
```

#### Recommendation:

- Remove container-level default options (convert, allowUnknown, etc.)
- Only keep express-specific options (passError, statusCode)
- Pass empty `libraryOptions` or allow user to specify per-validation

---

### 6. **Package Naming**

#### Current: `express-joi-validation`

#### Options:

1. **Keep Name** - For backward compatibility, document multi-library support
2. **Rename** - `express-standard-schema-validation` (breaking change)
3. **New Package** - Create new, deprecate old

#### Recommendation:

- Keep name initially for easier migration path
- Update description and documentation to reflect Standard Schema support
- Consider major version bump (v7.0.0)

---

## Proposed API Changes

### Before (Joi-specific):

```javascript
const Joi = require('joi')
const validator = createValidator({
  passError: true,
  joi: { convert: true },
})

const schema = Joi.object({ name: Joi.string() })

app.get('/hello', validator.query(schema), handler)
```

### After (Standard Schema):

```javascript
// Works with Joi, Zod, Valibot, Arktype, etc.
const v = require('valibot')
const validator = createValidator({
  passError: true,
})

// Schema includes all configuration
const schema = v.object({
  name: v.pipe(
    v.string(),
    v.transform((s) => s.trim()),
  ),
})

app.get('/hello', validator.query(schema), handler)
```

---

## Configuration Matrix

| Feature        | Current Approach           | Proposed Approach                     |
| -------------- | -------------------------- | ------------------------------------- |
| Unknown fields | Container config           | Schema definition                     |
| Type coercion  | Container config           | Schema definition                     |
| Abort early    | Container config           | Removed (use Standard Schema default) |
| Status codes   | Container/validator config | ✅ Keep as-is                         |
| Pass errors    | Container/validator config | ✅ Keep as-is                         |

---

## Breaking Changes Summary

1. Remove `joi` property from config objects
2. Remove default validation options (convert, allowUnknown, etc.)
3. Remove `isJoi` from error objects
4. Update TypeScript types to use Standard Schema types
5. Update peerDependencies (remove Joi requirement)
6. Error handler format changes (use `issues` instead of `error.details`)

---

## Migration Path for Users

### Joi Users (>= 18.0.0):

- Joi 18+ includes Standard Schema support
- Move validation options to schema definition
- Update error handlers to check for `issues` instead of `error.isJoi`

### New Users:

- Choose any Standard Schema-compatible library
- Configure validation behavior in schemas
- Use Standard Schema error format
