# Contributing to Soulmate Journal

Thank you for contributing to Soulmate Journal! To maintain code quality, security, and developer efficiency, we enforce the following development standards.

---

## 🛠️ Development & Coding Standards

### 1. Code Quality & Formatting
- **Linting**: All files must pass ESLint validations with zero warnings and zero errors before being merged. Run `npm run lint`.
- **Variable Declarations**: Banish `var` completely. Use `const` for variables that are not reassigned and `let` for reassigned values.
- **Equality**: Enforce strict equality `===` instead of loose equality `==`.
- **Code Comments**: Document functions, parameters, return types, and complex algorithms using standard **JSDoc** formatting.

### 2. React Guidelines
- **Type Checking**: All React components receiving props must define validations using the `prop-types` package.
- **React Hooks**: Never call hooks conditionally or inside loops. Always adhere to the Rules of Hooks. Fix dependency arrays for `useEffect` and `useCallback` instead of ignoring warnings.
- **Telemetry**: Add page-load timing measurements in `useEffect` hooks for page entries and log AI Latency tracking wrapper helpers.

### 3. Security Requirements
- All files are scanned for potential security vulnerabilities using `eslint-plugin-security`.
- Avoid direct object key injection patterns (e.g., dynamic property lookup via unvalidated user input).
- Do not commit sensitive credentials, API keys, or environment files (`.env` files).

---

## 🧪 Testing Standards

We use **Vitest** and **React Testing Library** for unit and integration testing.
- All new features and utility helpers must be accompanied by comprehensive tests under the `tests/` directory.
- Mocks should be used for browser storage (`localStorage`, `sessionStorage`) and Web Crypto APIs where browser environments are not present in head-only environments.
- Verify tests pass before making pull requests:
  ```bash
  npm run test
  ```

---

## 📌 Git Workflow & Conventional Commits

We follow the **Conventional Commits** format for clear and readable commit histories:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes only
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries (such as documentation generation, dependencies changes)

### Example commit message:
```
feat(auth): add email OTP verification step for secure accounts login
```

---

## 🚀 Build Verification

Before opening a pull request, run the complete validation checklist:
1. Run lint check: `npm run lint`
2. Run test suite: `npm run test`
3. Run production build to ensure clean bundling: `npm run build`
