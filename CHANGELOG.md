# CHANGELOG

Date format is DD/MM/YYYY

## 0.2.0 (19/12/2024)

**TypeScript Migration**

This release converts the entire codebase from JavaScript to TypeScript.

### ✨ New Features

- **TypeScript First** - Entire codebase now written in TypeScript with strict mode enabled
- **Auto-Generated Types** - Type definitions are now generated from TypeScript source
- **Source Maps** - Full source map support for debugging
- **Better Type Safety** - Improved type inference and compile-time checks

### 💥 Breaking Changes

- **Main entry point changed** - Now uses `dist/index.js` (compiled from TypeScript)
- **Type definitions** - Auto-generated from TypeScript instead of hand-written `.d.ts` file
- Examples must now import from `dist/index.js` path

### 🔧 Internal Changes

- All source code migrated to `src/` directory
- Tests converted to TypeScript
- Build process uses TypeScript compiler (`tsc`)
- Added `tsconfig.json` and `tsconfig.test.json` configuration
- Updated `.gitignore` and added `.npmignore`
- Updated package.json with build scripts

## 1.0.0 (17/12/2024)

**Major Version - Breaking Changes**

This is the first release of `express-standard-schema-validation`, a fork of `express-joi-validation` with Standard Schema V1 support.

### ✨ New Features

- **Multi-Library Support** - Now supports 4 validation libraries through Standard Schema V1:
  - Joi >= 18.0.0
  - Zod >= 3.23.0
  - ArkType >= 2.0.0-rc
  - Valibot >= 1.0.0
- **Standard Schema V1** - Built on the Standard Schema specification for universal validation
- **Comprehensive Test Coverage** - 66 tests covering all 4 libraries

### 💥 Breaking Changes

- **Package renamed** - `express-joi-validation` → `express-standard-schema-validation`
- **Options system removed** - No more `libraryOptions` parameter in middleware configuration
  - **Before:** `validator.body(schema, { libraryOptions: { convert: true } })`
  - **After:** Configure validation on the schema itself
- **Configuration philosophy** - All validation behavior must be configured on schemas, not middleware
  - **Joi:** Use `.options()`, `.unknown()`, etc. on schemas
  - **Zod:** Use `.passthrough()`, `.strict()`, `.coerce`, etc. on schemas
  - **ArkType:** Configure in schema definition syntax
  - **Valibot:** Use `strictObject()`, `looseObject()`, pipes, etc.

### 🔧 Migration Guide

```diff
- const validator = require('express-joi-validation').createValidator({
-   joi: { convert: true, allowUnknown: false }
- })
+ const validator = require('express-standard-schema-validation').createValidator()

- const schema = Joi.object({ name: Joi.string() })
+ const schema = Joi.object({ name: Joi.string() })
+   .options({ convert: true, allowUnknown: false })

  app.get('/hello', validator.query(schema), handler)
```

For Zod users:

```js
// Configure validation on the schema
const schema = z
  .object({
    name: z.string(),
    age: z.coerce.number(), // Type coercion
  })
  .strict(); // Reject extra properties
```

### 📦 Dependencies

- Added `arktype` >= 2.0.0-rc.8 (dev dependency)
- Added `valibot` >= 1.0.0 (dev dependency)
- Updated `zod` >= 3.23.0 (dev dependency)
- Maintained `joi` >= 18.0.0 (dev dependency)
- Node.js >= 18.0.0 required

### 📝 Documentation

- Complete README rewrite with examples for all 4 libraries
- Library migration guides (Joi → Zod, Joi → ArkType, Joi → Valibot)
- Standard Schema V1 documentation
- TypeScript usage examples

---

## Previous Releases (as express-joi-validation)

## 6.1.0 (27/05/2025)

- Implement express v5 compatibility (#47)
- Use Prettier instead of ESLint

## 6.0.0 (13/10/2024)

- Support Node.js 18+
- Narrow type for error handlers (#46)

## 5.0.0 (13/10/2020)

- Drop Node.js 8 support.
- Update to use Joi v17.x.
- Change from using peerDependency of "@hapi/joi" to "joi".

## 4.0.3 (18/11/2019)

- Fix TypeScript example in the README.

## 4.0.2 (12/11/2019)

- Apply a fix for compatibility with Joi v16 typings.

## 4.0.1 (24/09/2019)

- Remove outdated "joi" option in README

## 4.0.0 (20/09/2019)

- Update to support Joi v16.x
- No longer supports passing a Joi instance to factory
- Finally removed deprecated function on `module.exports` from v2

## 3.0.0 (30/08/2019)

- Removed `fields`, `originalQuery`, `originalHeaders`, `originalBody`,
  `originalParams`, and `originalFields` from `ValidatedRequest`. This simplifies
  usage with TypeScript's _strict_ mode.
- Added `ValidatedRequestWithRawInputsAndFields`. This is the same as
  `ValidatedRequest` from versions 2.x.

## 2.0.1 (22/08/2019)

- Fixed compilation issue with TypeScript example when `strict` compiler flag is `true`.
- Updated test script to include building TypeScript example

## 2.0.0 (27/06/2019)

- Improved TypeScript support with better typings
- Changed export from a factory function to a module exposing `createValidator()`
- Improved TypeScript examples and README

## 1.0.0 (13/06/2019)

- Migrated from `joi` to `@hapi/joi`.
- Dropped Node.js 6 & 7 support (@hapi/joi forces this)
- Update dev dependencies.

## 0.3.0 (29/09/2018)

- Add response validation
- Update dependencies
- Drop support for Node.js 4 and below
- Remove @types/express from dependencies

## 0.2.1 (28/10/2017)

- Ensure "typings" are defined in package.json

## 0.2.0 (28/10/2017)

- Add TypeScript support
- Add new `fields` function for use with express-formidable

## 0.1.0 (16/04/2017)

- Initial release.
