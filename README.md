- [NextJS Packages Monorepo](#nextjs-packages-monorepo)
  - [📦 Architecture Overview](#-architecture-overview)
    - [🎯 Independent Package Philosophy](#-independent-package-philosophy)
  - [📚 Available Packages](#-available-packages)
    - [@core-mfg/nextjs-logging](#core-mfgnextjs-logging)
    - [@core-mfg/nextjs-settings](#core-mfgnextjs-settings)
  - [🚀 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Development Workflow](#development-workflow)
  - [📋 Publishing Workflow](#-publishing-workflow)
    - [For Package Maintainers](#for-package-maintainers)
      - [1. Prepare for Release](#1-prepare-for-release)
      - [2. Commit Changes](#2-commit-changes)
      - [3. Create Version Tag](#3-create-version-tag)
      - [4. Monitor CI/CD](#4-monitor-cicd)
    - [Environment Setup](#environment-setup)
  - [🔧 Development Guidelines](#-development-guidelines)
    - [Adding a New Package](#adding-a-new-package)
    - [Package Structure Standards](#package-structure-standards)
    - [Code Quality](#code-quality)
  - [📚 Resources](#-resources)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)

# NextJS Packages Monorepo

A monorepo containing specialized Next.js packages designed for modern web applications. Each package is built and published independently to provide focused, high-quality solutions for common Next.js development challenges.

## 📦 Architecture Overview

This monorepo uses [pnpm workspaces](https://pnpm.io/workspaces) to manage multiple packages efficiently:

```
nextjs-packages/
├── packages/
│   ├── nextjs-logging/     # Comprehensive logging package
│   └── nextjs-settings/     # Settings management package
├── apps/                   # Future: Example applications
└── package.json           # Workspace root configuration
```

### 🎯 Independent Package Philosophy

Each package in this monorepo is designed to be:
- **Self-contained** - No cross-dependencies between packages
- **Independently versioned** - Each package has its own semantic versioning
- **Separately published** - Packages are published to npm independently
- **Focused** - Each package solves a specific problem domain

## 📚 Available Packages

### [@core-mfg/nextjs-logging](packages/nextjs-logging/)

A comprehensive logging package for Next.js applications with real-time configuration management.

**Key Features:**
- 📝 Multi-level logging (debug, info, warn, error, fatal, success, trace, start)
- 🏪 Client-side Zustand store with localStorage persistence
- 🔄 Real-time log level changes via API
- 🌐 Built-in API routes for configuration management
- 📦 Multiple storage backends (memory, file, Redis)
- 🎯 TypeScript-first with full type safety

**Current Version:** `0.0.6`

### [@core-mfg/nextjs-settings](packages/nextjs-settings/)

A settings management package with client-side state management and server synchronization.

**Key Features:**
- 🏪 Client-side Zustand store with automatic persistence
- 💾 localStorage middleware for client-side persistence
- 🔄 Real-time settings synchronization
- 🌐 Built-in API integration
- ⚡ Optimistic updates with server persistence
- 🎯 Full TypeScript support with generic interfaces

**Current Version:** See package for latest

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm/yarn
- Git

### Installation

Clone the repository:
```bash
git clone https://github.com/core-mfg/nextjs-packages.git
cd nextjs-packages
```

Install dependencies:
```bash
pnpm install
```

### Development Workflow

Run tests for all packages:
```bash
pnpm test
```

Run tests for a specific package:
```bash
pnpm --filter nextjs-logging test
pnpm --filter nextjs-settings test
```

Build all packages:
```bash
pnpm build
```

Build a specific package:
```bash
pnpm --filter nextjs-logging build
```

## 📋 Publishing Workflow

Each package is published independently to GitHub Package Registry. The process is automated via GitHub Actions.

### For Package Maintainers

#### 1. Prepare for Release

Navigate to the package directory:
```bash
cd packages/nextjs-logging
```

Update version in `package.json` following [semantic versioning](https://semver.org/):
```json
{
  "version": "0.0.6"
}
```

Update `CHANGELOG.md` with changes:
```markdown
## [0.0.6] - YYYY-MM-DD

### Added
- New feature description

### Fixed
- Bug fix description
```

#### 2. Commit Changes

```bash
git add .
git commit -m "chore: bump nextjs-logging version to 0.0.6

- Updated package.json version
- Updated CHANGELOG.md
- [Brief description of changes]"
```

#### 3. Create Version Tag

Create a tag following the format `nextjs-{package-name}-v{major}.{minor}.{patch}`:

```bash
# For nextjs-logging v0.0.6
git tag nextjs-logging-v0.0.6

# Push commit and tag
git push origin main
git push origin nextjs-logging-v0.0.6
```

#### 4. Monitor CI/CD

The GitHub Actions workflow will:
1. Detect the tag push
2. Extract the package name from the tag
3. Build and publish only that package
4. Make it available on npm

Monitor the [Actions tab](https://github.com/core-mfg/nextjs-packages/actions) for successful publication.

### Environment Setup

For publishing to work, the repository needs:
- `PACKAGE_MGR_TOKEN`: GitHub personal access token with package write permissions
- Proper `publishConfig` in each package's `package.json`

## 🔧 Development Guidelines

### Adding a New Package

1. Create package directory: `packages/your-package-name/`
2. Add `package.json` with proper configuration
3. Set up TypeScript configuration
4. Add tests with Vitest
5. Create comprehensive README
6. Add development documentation

### Package Structure Standards

Each package should follow this structure:
```
packages/your-package/
├── src/                 # Source code
├── test/               # Unit tests
├── dist/               # Built output (gitignored)
├── README.md           # Package documentation
├── DEVELOPMENT.md      # Development guide
├── package.json        # Package configuration
├── tsconfig.json       # TypeScript configuration
└── vitest.config.ts    # Test configuration
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **Testing**: Comprehensive unit test coverage
- **Linting**: ESLint configuration
- **Documentation**: README and API documentation
- **CI/CD**: Automated testing and publishing

## 📚 Resources

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [GitHub Packages](https://docs.github.com/en/packages)
- [Semantic Versioning](https://semver.org/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Make changes** and ensure tests pass
4. **Update documentation** if needed
5. **Submit** a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Note**: This monorepo focuses on creating high-quality, independent packages that can be used across multiple Next.js projects. Each package is designed to solve specific problems while maintaining excellent developer experience and TypeScript support.