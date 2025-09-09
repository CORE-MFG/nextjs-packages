- [Development Guide - NextJS Logging Package](#development-guide---nextjs-logging-package)
  - [🚀 Publishing a New Version](#-publishing-a-new-version)
    - [Prerequisites](#prerequisites)
    - [Step-by-Step Publishing Process](#step-by-step-publishing-process)
      - [1. Update Package Version](#1-update-package-version)
      - [2. Update Changelog (Recommended)](#2-update-changelog-recommended)
      - [3. Commit Changes](#3-commit-changes)
      - [4. Create and Push Version Tag](#4-create-and-push-version-tag)
      - [5. Monitor CI/CD Pipeline](#5-monitor-cicd-pipeline)
  - [🔧 Development Workflow](#-development-workflow)
    - [Local Development Setup](#local-development-setup)
    - [Testing Changes](#testing-changes)
    - [Version Pre-release Testing](#version-pre-release-testing)
  - [📋 CI/CD Workflow Details](#-cicd-workflow-details)
    - [Environment Variables Required](#environment-variables-required)
  - [🐛 Troubleshooting](#-troubleshooting)
    - [Common Issues](#common-issues)
      - [Tag Not Triggering Workflow](#tag-not-triggering-workflow)
      - [Build Fails in CI/CD](#build-fails-in-cicd)
      - [Publish Fails](#publish-fails)
    - [Rollback Strategy](#rollback-strategy)
  - [📚 Additional Resources](#-additional-resources)
  - [🤝 Contributing](#-contributing)

# Development Guide - NextJS Logging Package

This guide covers the development workflow for publishing new versions of the `@core-mfg/nextjs-logging` package.

## 🚀 Publishing a New Version

### Prerequisites

- Node.js 20+
- pnpm installed globally
- Git repository access with push permissions
- GitHub repository access for publishing

### Step-by-Step Publishing Process

#### 1. Update Package Version

Navigate to the package directory and update the version in `package.json`:

```bash
cd packages/nextjs-logging
```

Update the version number following [semantic versioning](https://semver.org/):

```json
{
  "name": "@core-mfg/nextjs-logging",
  "version": "0.0.6",  // Increment based on changes
  ...
}
```

**Version Guidelines:**
- **PATCH** (`0.0.X`): Bug fixes, minor improvements
- **MINOR** (`0.X.0`): New features, backwards compatible
- **MAJOR** (`X.0.0`): Breaking changes

#### 2. Update Changelog (Recommended)

Update the `CHANGELOG.md` file to document the changes:

```markdown
# Changelog

## [0.0.6] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Modified feature description

### Fixed
- Bug fix description

### Removed
- Removed feature description
```

#### 3. Commit Changes

Commit the version update and any other changes:

```bash
git add .
git commit -m "chore: bump version to 0.0.6

- Updated package.json version
- Updated CHANGELOG.md
- [Brief description of changes]"
```

#### 4. Create and Push Version Tag

Create a tag following the format `nextjs-logging-v{major}.{minor}.{patch}`:

```bash
# For version 0.0.6
git tag nextjs-logging-v0.0.6

# Push the commit and tag
git push origin main
git push origin nextjs-logging-v0.0.6
```

**Important:** The tag format must match the pattern `*-v*.*.*` as defined in the CI/CD workflow.

#### 5. Monitor CI/CD Pipeline

After pushing the tag, the GitHub Actions workflow will:

1. **Trigger**: Detect the tag push matching `*-v*.*.*`
2. **Extract**: Parse package name (`nextjs-logging`) from tag
3. **Build**: Run `pnpm --filter ./packages/nextjs-logging build`
4. **Publish**: Run `pnpm --filter ./packages/nextjs-logging publish --access public --no-git-checks`

Monitor the [Actions tab](https://github.com/core-mfg/nextjs-packages/actions) to ensure successful publication.

## 🔧 Development Workflow

### Local Development Setup

```bash
# Install dependencies
pnpm install

# Build the package
pnpm --filter ./packages/nextjs-logging build

# Run tests
pnpm --filter ./packages/nextjs-logging test

# Run tests in watch mode
pnpm --filter ./packages/nextjs-logging test:watch
```

### Testing Changes

Before publishing, ensure:

1. **Unit Tests Pass**: `pnpm test`
2. **TypeScript Compilation**: `pnpm build`
3. **Linting**: No ESLint errors
4. **Manual Testing**: Test key functionality in a test project

### Version Pre-release Testing

For major changes, consider creating a pre-release version:

```bash
# Update package.json to pre-release version
"version": "0.1.0-beta.1"

# Create pre-release tag
git tag nextjs-logging-v0.1.0-beta.1
git push origin nextjs-logging-v0.1.0-beta.1
```

## 📋 CI/CD Workflow Details

The publishing process is automated via GitHub Actions (`.github/workflows/publish.yml`):

```yaml
name: Publish Packages
on:
  push:
    tags:
      - "*-v*.*.*"  # Matches tags like nextjs-logging-v0.0.6

jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    steps:
      # 1. Checkout repository
      # 2. Setup Node.js 20
      # 3. Extract package name from tag (e.g., "nextjs-logging")
      # 4. Install dependencies with pnpm
      # 5. Build specific package
      # 6. Publish to GitHub Package Registry
```

### Environment Variables Required

The workflow requires:
- `PACKAGE_MGR_TOKEN`: GitHub personal access token with package write permissions

## 🐛 Troubleshooting

### Common Issues

#### Tag Not Triggering Workflow
- **Symptom**: No GitHub Action runs after pushing tag
- **Check**: Tag format must be `packagename-vX.Y.Z` (e.g., `nextjs-logging-v0.0.6`)
- **Fix**: Delete and recreate tag with correct format:
  ```bash
  git tag -d nextjs-logging-v0.0.6
  git tag nextjs-logging-v0.0.6
  git push origin :refs/tags/nextjs-logging-v0.0.6
  git push origin nextjs-logging-v0.0.6
  ```

#### Build Fails in CI/CD
- **Check**: Local build works with `pnpm build`
- **Check**: All dependencies are properly declared
- **Check**: No TypeScript compilation errors

#### Publish Fails
- **Check**: `PACKAGE_MGR_TOKEN` has correct permissions
- **Check**: Package name matches registry configuration
- **Check**: Version hasn't been published before

### Rollback Strategy

If a publish fails or introduces issues:

1. **Don't delete published packages** (breaks semantic versioning)
2. **Publish a patch version** with fixes
3. **Document issues** in CHANGELOG.md
4. **Communicate** with consumers about the issue

## 📚 Additional Resources

- [Semantic Versioning](https://semver.org/)
- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [pnpm Documentation](https://pnpm.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🤝 Contributing

When contributing code changes:

1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Make changes** and test thoroughly
3. **Update tests** if adding functionality
4. **Update documentation** if needed
5. **Create PR** with clear description
6. **Version bump** will be handled during release

---

**Remember**: Always test thoroughly before publishing. The package registry is public and versions are immutable once published.
