# Phase 4: Release & Publishing

This document outlines the release process for both `express-standard-schema-validation` v1.0.0 and `@pella/rest-api` v5.0.0.

## Prerequisites

Before starting this phase, ensure:

- [ ] Phase 1 completed: express-standard-schema-validation updated and tested
- [ ] Phase 2 completed: rest-api migrated and tested
- [ ] Phase 3 completed: All tests passing with 100% coverage
- [ ] All documentation updated (README, CHANGELOG, MIGRATION guides)
- [ ] No known critical bugs
- [ ] CI/CD pipelines green

## 4.1: express-standard-schema-validation v1.0.0 Release

### Pre-Release Checklist

#### Code Quality

- [ ] All tests passing (Joi, Zod, ArkType, Valibot)
- [ ] 100% test coverage maintained
- [ ] TypeScript definitions validated
- [ ] No ESLint/Prettier violations
- [ ] All examples working correctly

#### Documentation

- [ ] README.md updated with:
  - [ ] New API without options system
  - [ ] Examples for all 4 validation libraries
  - [ ] Migration guide from express-joi-validation
  - [ ] Clear "no vendor-specific config" philosophy
- [ ] CHANGELOG.md updated with v1.0.0 entry
- [ ] package.json version bumped to 1.0.0
- [ ] LICENSE file present and correct
- [ ] JSDoc comments complete

#### Dependencies

- [ ] Peer dependencies correctly specified:
  ```json
  "peerDependencies": {
    "express": ">=4.0.0"
  },
  "peerDependenciesMeta": {
    "joi": { "optional": true },
    "zod": { "optional": true },
    "arktype": { "optional": true },
    "valibot": { "optional": true }
  }
  ```
- [ ] Dev dependencies up to date
- [ ] No security vulnerabilities (`npm audit`)

#### Package Metadata

- [ ] package.json fields complete:
  - [ ] name: `express-standard-schema-validation`
  - [ ] version: `1.0.0`
  - [ ] description accurate
  - [ ] keywords relevant
  - [ ] repository URL correct
  - [ ] author/contributors listed
  - [ ] license: MIT
  - [ ] engines: `{ "node": ">=18.0.0" }`
- [ ] .npmignore or package.json files field configured
- [ ] Ensure test files excluded from npm package

### Publishing Steps

1. **Final Verification**

   ```bash
   npm test
   npm run lint
   npm audit
   ```

2. **Build Package** (if applicable)

   ```bash
   # Clean any build artifacts
   npm run clean  # if script exists

   # Create package preview
   npm pack
   # Inspect contents of generated .tgz file
   ```

3. **Git Tag**

   ```bash
   git add .
   git commit -m "Release v1.0.0"
   git tag -a v1.0.0 -m "Release v1.0.0 - Standard Schema V1 support"
   git push origin main
   git push origin v1.0.0
   ```

4. **Publish to npm**

   ```bash
   # Ensure logged in
   npm whoami

   # Publish
   npm publish --access public
   ```

5. **Verify Publication**

   ```bash
   # Check npm registry
   npm view express-standard-schema-validation

   # Test installation in fresh project
   mkdir test-install && cd test-install
   npm init -y
   npm install express-standard-schema-validation joi
   # Write quick test to verify import works
   ```

### Post-Release Tasks

- [ ] Create GitHub Release with:
  - [ ] Tag v1.0.0
  - [ ] Release notes from CHANGELOG
  - [ ] Highlight breaking changes
  - [ ] Migration guide link
- [ ] Announce release (if applicable):
  - [ ] Team Slack/Discord
  - [ ] Twitter/social media
  - [ ] Update any related blog posts
- [ ] Monitor npm download stats
- [ ] Monitor GitHub issues for bug reports

## 4.2: @pella/rest-api v5.0.0 Release

### Pre-Release Checklist

#### Code Quality

- [ ] All tests passing
- [ ] 100% test coverage maintained
- [ ] TypeScript types validated (if applicable)
- [ ] No ESLint/Prettier violations
- [ ] Load tests passed (performance benchmarks)
- [ ] All examples working with new validation

#### Documentation

- [ ] README.md updated with:
  - [ ] New validation examples (inline schema config)
  - [ ] Link to MIGRATION.md
  - [ ] Updated API documentation
  - [ ] Breaking changes clearly marked
- [ ] MIGRATION.md complete with:
  - [ ] Step-by-step migration from v4.x
  - [ ] Code comparison examples
  - [ ] Common pitfalls section
  - [ ] FAQ section
- [ ] CHANGELOG.md updated with v5.0.0 entry
- [ ] package.json version bumped to 5.0.0
- [ ] JSDoc/TSDoc comments complete

#### Dependencies

- [ ] express-standard-schema-validation v1.0.0 dependency correct
- [ ] Zod peer dependency version correct: `>=3.23.0` (not `^4.2.0`)
- [ ] All other dependencies up to date
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Peer dependency warnings acceptable

#### Breaking Changes Documentation

- [ ] All breaking changes documented:
  - [ ] Package name change: `express-joi-validation` → `express-standard-schema-validation`
  - [ ] No more vendor-specific options in middleware
  - [ ] Configuration must be in schemas
  - [ ] Error structure changes (if any)
  - [ ] Function name changes (if any)
- [ ] Migration effort estimated and communicated

#### Backward Compatibility

- [ ] `catchJoiValidationErrors` alias maintained (if decided)
- [ ] Error format compatible during transition (if required)
- [ ] Documented compatibility layer (if any)

### Publishing Steps

1. **Final Verification**

   ```bash
   npm test
   npm run lint
   npm audit
   npm run build  # if applicable
   ```

2. **Integration Testing**

   ```bash
   # Test with real express-standard-schema-validation from npm
   npm uninstall express-standard-schema-validation
   npm install express-standard-schema-validation@1.0.0
   npm test
   ```

3. **Git Tag**

   ```bash
   git add .
   git commit -m "Release v5.0.0 - Migrate to Standard Schema V1"
   git tag -a v5.0.0 -m "Release v5.0.0 - Breaking: Migrate to Standard Schema V1"
   git push origin main
   git push origin v5.0.0
   ```

4. **Publish to npm** (if public package)

   ```bash
   npm whoami
   npm publish --access public  # or --access restricted for private
   ```

   **OR Deploy Internally** (if private package)

   ```bash
   # Follow internal deployment procedures
   # May involve private registry, artifact repository, etc.
   ```

5. **Verify Publication**

   ```bash
   npm view @pella/rest-api@5.0.0

   # Test installation
   mkdir test-install && cd test-install
   npm init -y
   npm install @pella/rest-api@5.0.0 joi
   # Verify imports work
   ```

### Post-Release Tasks

- [ ] Create GitHub Release with:
  - [ ] Tag v5.0.0
  - [ ] Release notes from CHANGELOG
  - [ ] **PROMINENT breaking changes warning**
  - [ ] Link to MIGRATION.md
- [ ] Update internal documentation/wikis
- [ ] Notify all teams using @pella/rest-api:
  - [ ] Send migration guide
  - [ ] Offer migration support
  - [ ] Set timeline for adoption
- [ ] Monitor for bug reports
- [ ] Track adoption metrics (if possible)
- [ ] Plan support timeline:
  - [ ] How long will v4.x be supported?
  - [ ] Security patches for v4.x?
  - [ ] When to deprecate v4.x?

## 4.3: Rollback Procedures

### If Issues Found with express-standard-schema-validation v1.0.0

1. **Immediate Actions**

   ```bash
   # Unpublish if within 72 hours and no dependents
   npm unpublish express-standard-schema-validation@1.0.0

   # OR deprecate if too late to unpublish
   npm deprecate express-standard-schema-validation@1.0.0 "Critical bug - use v1.0.1"
   ```

2. **Fix and Re-release**

   - Create hotfix branch
   - Fix critical issue
   - Bump to v1.0.1
   - Fast-track testing
   - Re-publish

3. **Communication**
   - Post GitHub issue explaining problem
   - Update release notes
   - Notify any early adopters

### If Issues Found with @pella/rest-api v5.0.0

1. **Assess Severity**

   - Critical bug affecting production? → Immediate rollback
   - Minor issue? → Fast-track patch release

2. **Rollback Steps** (if needed)

   ```bash
   # If possible, unpublish (within 72 hours)
   npm unpublish @pella/rest-api@5.0.0

   # OR deprecate and advise rollback
   npm deprecate @pella/rest-api@5.0.0 "Critical bug - stay on v4.x"
   ```

3. **Team Communication**

   - Send immediate alert to all teams
   - Provide rollback instructions:
     ```bash
     npm install @pella/rest-api@4.x.x
     ```
   - Explain issue and timeline for fix

4. **Fix and Re-release**
   - Create hotfix branch from v5.0.0 tag
   - Fix critical issue
   - Bump to v5.0.1
   - Expedited testing
   - Re-publish with detailed release notes

## 4.4: Monitoring & Support

### Week 1 After Release

- [ ] Check npm download stats daily
- [ ] Monitor GitHub issues hourly
- [ ] Respond to questions within 4 hours
- [ ] Track any bug reports in spreadsheet:
  - Issue description
  - Severity (critical/high/medium/low)
  - Affected versions
  - Workaround available?
  - Fix timeline

### Week 2-4 After Release

- [ ] Check metrics every 2-3 days
- [ ] Monitor GitHub issues twice daily
- [ ] Track adoption rate (if measurable)
- [ ] Collect feedback from teams
- [ ] Plan patch releases if needed

### Metrics to Track

- **express-standard-schema-validation:**

  - npm downloads per week
  - GitHub stars/forks
  - Open vs closed issues
  - Community contributions

- **@pella/rest-api:**
  - Internal adoption rate
  - Migration completion percentage
  - Bug reports count
  - Performance metrics in production

### Support Plan

- **express-standard-schema-validation:**

  - Respond to GitHub issues within 48 hours
  - Review pull requests within 1 week
  - Monthly dependency updates
  - Quarterly feature review

- **@pella/rest-api:**
  - Internal support channel monitoring
  - Migration assistance office hours (first 2 weeks)
  - v4.x security patches for 6 months
  - v4.x complete sunset after 1 year

## 4.5: Success Criteria

Release is considered successful when:

### express-standard-schema-validation

- [ ] Zero critical bugs reported in first week
- [ ] 100+ npm downloads in first month
- [ ] All 4 validation libraries confirmed working by community
- [ ] At least one external contributor or issue filed
- [ ] No unpublish or deprecation needed

### @pella/rest-api

- [ ] Zero critical bugs in production
- [ ] 50%+ internal teams migrated within 1 month
- [ ] 100% internal teams migrated within 3 months
- [ ] No rollbacks required
- [ ] Performance metrics maintained or improved
- [ ] Positive feedback from development teams

## Timeline Summary

| Task                                            | Duration              | Owner              |
| ----------------------------------------------- | --------------------- | ------------------ |
| express-standard-schema-validation final checks | 0.5 day               | Package maintainer |
| express-standard-schema-validation publish      | 0.5 day               | Package maintainer |
| @pella/rest-api final checks                    | 0.5 day               | Rest API team      |
| @pella/rest-api publish                         | 0.5 day               | Rest API team      |
| Initial monitoring (Week 1)                     | 1 week                | Both teams         |
| **Total Phase 4 Duration**                      | **~2 days + ongoing** |                    |

## Checklist: Ready to Start Phase 4?

Before beginning Phase 4, confirm:

- [ ] Phase 1 complete: express-standard-schema-validation updated
- [ ] Phase 2 complete: rest-api migrated
- [ ] Phase 3 complete: All testing passed
- [ ] All documentation reviewed and approved
- [ ] Team/stakeholders notified of upcoming release
- [ ] Rollback procedures understood and practiced
- [ ] Support plan in place
- [ ] Post-release monitoring resources allocated

---

**Next Steps After Phase 4:**

1. Monitor releases for first 30 days
2. Collect feedback and plan improvements
3. Consider future enhancements (e.g., more validation libraries)
4. Update roadmap based on community/team feedback
