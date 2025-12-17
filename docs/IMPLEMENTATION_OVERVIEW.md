# Implementation Overview: Standard Schema Migration

## 🎯 Project Goal

Migrate `@pella/rest-api` from `express-joi-validation` to `express-standard-schema-validation` to support any validation library that implements Standard Schema V1 (Joi, Zod, ArkType, Valibot).

## 📊 Quick Stats

- **Packages Affected:** 2
- **Breaking Changes:** Yes (Major version bumps)
- **Estimated Timeline:** 5-6 days
- **Test Coverage Required:** 100%
- **Supported Libraries:** 4 (Joi, Zod, ArkType, Valibot)

## 📋 Phase Summary

### Phase 1: Express Standard Schema Package

**Time:** 2-3 days  
**File:** [PHASE_1_EXPRESS_STANDARD_SCHEMA.md](./PHASE_1_EXPRESS_STANDARD_SCHEMA.md)

Prepare the `express-standard-schema-validation` package:

- ✅ Remove library-specific options system
- ✅ Add tests for ArkType and Valibot
- ✅ Update documentation and examples
- ✅ Publish to npm as v1.0.0

**Key Deliverables:**

- Clean, library-agnostic validation middleware
- 100% test coverage with 4 validation libraries
- Comprehensive README with examples
- Published npm package

---

### Phase 2: REST API Migration

**Time:** 2-3 days  
**File:** [PHASE_2_REST_API_MIGRATION.md](./PHASE_2_REST_API_MIGRATION.md)

Update `@pella/rest-api` to use the new package:

- ✅ Replace `express-joi-validation` dependency
- ✅ Update error handling for Standard Schema
- ✅ Update controllers and examples
- ✅ Create migration guide

**Key Deliverables:**

- Updated to v5.0.0
- Support for multiple validation libraries
- Backward compatibility where possible
- MIGRATION.md guide

---

### Phase 3: Testing Strategy

**Time:** 1 day  
**File:** [PHASE_3_TESTING.md](./PHASE_3_TESTING.md)

Comprehensive testing across both packages:

- ✅ Unit tests for all libraries
- ✅ Integration tests
- ✅ Acceptance tests
- ✅ Backward compatibility tests

**Key Deliverables:**

- 100% code coverage maintained
- Multi-library test suites
- Regression test validation
- Performance benchmarks

---

### Phase 4: Release & Publishing

**Time:** 0.5 day  
**File:** [PHASE_4_RELEASE.md](./PHASE_4_RELEASE.md)

Release both packages to production:

- ✅ Pre-release verification
- ✅ Publish to npm
- ✅ Update documentation
- ✅ Monitor rollout

**Key Deliverables:**

- Published packages
- Release notes
- Migration support
- Monitoring plan

---

## 🗓️ Timeline

```
Week 1:
├── Day 1-2: Phase 1 (Express Standard Schema)
│   ├── Remove options system
│   ├── Add ArkType tests
│   └── Add Valibot tests
├── Day 3: Phase 1 (continued)
│   ├── Update documentation
│   └── Publish v1.0.0
├── Day 4-5: Phase 2 (REST API Migration)
│   ├── Update dependencies
│   ├── Update code
│   └── Update tests
└── Day 6: Phase 3 & 4 (Testing & Release)
    ├── Run full test suite
    ├── Acceptance testing
    └── Release v5.0.0
```

## 🔑 Key Decisions

### 1. Drop Vendor-Specific Options ✅

**Decision:** Remove all library-specific configuration options from middleware  
**Rationale:** Aligns with Standard Schema philosophy; simplifies API  
**Impact:** Breaking change; users configure in schemas instead

### 2. External Package ✅

**Decision:** Use `express-standard-schema-validation` as separate package  
**Rationale:** Better separation of concerns; reusable by others  
**Impact:** Additional dependency; cleaner architecture

### 3. Direct Migration ✅

**Decision:** No deprecation period; clean break in major version  
**Rationale:** Simpler implementation; clearer migration path  
**Impact:** Requires migration guide; breaking change communication

### 4. Multi-Library Support ✅

**Decision:** Test with Joi, Zod, ArkType, and Valibot  
**Rationale:** Demonstrates true Standard Schema compatibility  
**Impact:** More comprehensive testing required

## 📦 Package Versions

### Before Migration

| Package                | Current Version | Dependency                   |
| ---------------------- | --------------- | ---------------------------- |
| @pella/rest-api        | 4.0.0           | express-joi-validation@6.1.0 |
| express-joi-validation | 6.1.0           | joi peer dependency          |

### After Migration

| Package                            | New Version | Dependencies                                |
| ---------------------------------- | ----------- | ------------------------------------------- |
| @pella/rest-api                    | 5.0.0       | express-standard-schema-validation@^1.0.0   |
| express-standard-schema-validation | 1.0.0       | joi, zod, arktype, valibot (optional peers) |

## 🚨 Breaking Changes

### express-standard-schema-validation

1. **Options removed** - No more `options` parameter in `createValidator()` or middleware
2. **API simplification** - Only `statusCode` and `passError` config remain
3. **Package name** - Fixed duplicate "validation" in name

### @pella/rest-api

1. **Dependency change** - `express-joi-validation` → `express-standard-schema-validation`
2. **Error format** - Joi-specific errors → Standard Schema `issues` array
3. **Function rename** - `catchJoiValidationErrors` → `catchValidationErrors` (alias kept)
4. **Schema configuration** - All validation options must be in schemas

## 🎓 Migration Path for Users

### Simple Case (Joi users)

1. Update `@pella/rest-api` to v5.0.0
2. Add `.options()` to Joi schemas if needed
3. Test validation still works

### Complex Case (Adding Zod)

1. Update `@pella/rest-api` to v5.0.0
2. Install `zod` peer dependency
3. Convert some schemas to Zod
4. Test both Joi and Zod schemas work

## ✅ Success Criteria

### Technical

- [ ] All tests pass with 100% coverage
- [ ] Supports Joi, Zod, ArkType, Valibot
- [ ] No library-specific code in middleware
- [ ] TypeScript definitions compile
- [ ] Published to npm successfully

### Documentation

- [ ] README updated with all libraries
- [ ] Migration guide complete
- [ ] CHANGELOG updated
- [ ] Examples verified working
- [ ] API documentation complete

### Quality

- [ ] No regressions in functionality
- [ ] Error messages are clear
- [ ] Performance is acceptable
- [ ] Backward compatibility maintained where possible

## 🔗 Dependencies Between Phases

```
Phase 1 (Express Standard Schema)
    ↓ (must publish first)
Phase 2 (REST API Migration)
    ↓ (must update code)
Phase 3 (Testing)
    ↓ (must pass tests)
Phase 4 (Release)
```

**Critical Path:**

- Phase 1 must be published before Phase 2 can install it
- Phase 3 must pass before Phase 4 release
- Cannot skip phases

## 📞 Support & Communication

### Internal Team

- **Slack Channel:** #rest-api-migration (create if needed)
- **Daily Standups:** Progress updates
- **Blocker Resolution:** Escalate immediately

### External Users (after release)

- **Migration Guide:** MIGRATION.md in repo
- **Breaking Changes:** Highlighted in CHANGELOG
- **Support:** GitHub issues, documentation

## 🛠️ Tools & Resources

### Development

- **Node.js:** >=18.0.0
- **npm:** Latest
- **Git:** Version control
- **IDE:** VSCode recommended

### Testing

- **Vitest:** Test framework (rest-api)
- **Mocha/Chai:** Test framework (express-standard-schema)
- **NYC:** Coverage tool
- **Supertest:** HTTP assertions

### CI/CD

- **GitHub Actions:** Automated testing
- **npm:** Package registry
- **Coveralls:** Coverage reporting

## 📚 Reference Documentation

### Standard Schema

- [Standard Schema Spec](https://github.com/standard-schema/standard-schema)
- [Standard Schema V1 Interface](https://github.com/standard-schema/standard-schema#version-1)

### Validation Libraries

- [Joi Documentation](https://joi.dev/)
- [Zod Documentation](https://zod.dev/)
- [ArkType Documentation](https://arktype.io/)
- [Valibot Documentation](https://valibot.dev/)

### Express

- [Express.js Documentation](https://expressjs.com/)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)

## ⚠️ Risk Mitigation

### Risk: Breaking User Code

**Mitigation:**

- Comprehensive migration guide
- Keep backward compatibility aliases
- Clear error messages
- Gradual rollout plan

### Risk: Library Incompatibility

**Mitigation:**

- Test all 4 libraries thoroughly
- Document version requirements
- Optional peer dependencies
- Fallback error handling

### Risk: Performance Degradation

**Mitigation:**

- Benchmark before/after
- Optimize hot paths
- Monitor in production
- Profile if needed

### Risk: Incomplete Migration

**Mitigation:**

- Detailed phase documents
- Checklists for tracking
- Code review process
- Acceptance criteria

## 📈 Metrics to Track

### Development

- [ ] Lines of code changed
- [ ] Test coverage percentage
- [ ] Build time
- [ ] Documentation completeness

### Release

- [ ] npm download stats
- [ ] GitHub issues/PRs
- [ ] User feedback
- [ ] Migration adoption rate

### Quality

- [ ] Bug reports
- [ ] Performance metrics
- [ ] User satisfaction
- [ ] Support requests

## 🎉 Quick Start

To begin the migration:

1. **Read this overview** ✅
2. **Review [Phase 1 Document](./PHASE_1_EXPRESS_STANDARD_SCHEMA.md)**
3. **Set up development environment**
4. **Create feature branch**
5. **Begin Phase 1 implementation**

## 📝 Document Change Log

| Date       | Version | Changes                     | Author |
| ---------- | ------- | --------------------------- | ------ |
| DD/MM/YYYY | 1.0.0   | Initial implementation plan | Team   |

---

**Next Step:** Start with [Phase 1: Express Standard Schema Package](./PHASE_1_EXPRESS_STANDARD_SCHEMA.md)
