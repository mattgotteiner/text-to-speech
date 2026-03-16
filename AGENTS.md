# AGENTS.md

You are an expert React TypeScript developer working on a Vite-based SPA.

## Project Knowledge

- **Tech Stack:** React 19, TypeScript 5.7, Vite 6, Vitest 3
- **Node Version:** 22 (use fnm or nvm with `.node-version` or `.nvmrc`)
- **Package Manager:** npm

### File Structure

```
src/
├── assets/                  # Static assets (SVGs, images)
│   └── react.svg
├── components/              # Reusable UI components
│   └── Button/
│       ├── Button.css
│       ├── Button.test.tsx
│       ├── Button.tsx
│       └── index.ts
├── hooks/                   # Custom React hooks
│   ├── useCounter.test.ts
│   └── useCounter.ts
│   ├── useIsMobile.test.ts
│   └── useIsMobile.ts
├── test/                    # Test setup
│   ├── fixtures/
│   │   └── example.json
│   ├── helpers.test.ts
│   ├── helpers.ts
│   └── setup.ts
├── utils/                   # Utility functions
│   ├── formatDate.test.ts
│   └── formatDate.ts
│   ├── localStorage.test.ts
│   └── localStorage.ts
├── App.css
├── App.test.tsx
├── App.tsx                  # Root component
├── index.css                # Global styles
├── main.tsx                 # Entry point
└── vite-env.d.ts
```

- `public/` – Public static files served as-is
- `dist/` – Build output (gitignored)
- `.github/workflows/` – CI/CD configurations

## Commands You Can Use

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server with HMR; serves unbundled source for fast iteration |
| `npm run build` | TypeScript check + production build to `dist/` |
| `npm run preview` | Serve built `dist/` locally for final QA (run `build` first) |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI mode) |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check without emitting |

## Code Style

### TypeScript Practices

- Use TypeScript strict mode (enabled in `tsconfig.app.json`)
- Prefer `interface` for component props
- Use explicit return types for exported functions
- Never use `any` – prefer `unknown` for truly unknown types

### React Patterns

```tsx
// ✅ Good - typed props with interface
interface ButtonProps {
  /** Button label text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional disabled state */
  disabled?: boolean;
}

function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ Bad - untyped or any
function Button({ label, onClick }: any) {
  return <button onClick={onClick}>{label}</button>;
}
```

### Naming Conventions

- **Components:** PascalCase (`MyComponent.tsx`)
- **Hooks:** camelCase with `use` prefix (`useCustomHook.ts`)
- **Utilities:** camelCase (`formatDate.ts`)
- **Test files:** `*.test.tsx` or `*.spec.tsx`
- **CSS:** Match component name (`App.css` for `App.tsx`)

### File Organization

Follow the existing structure in `src/`. See examples:

- **Components:** `src/components/Button/` – React component with styles and tests
- **Hooks:** `src/hooks/useCounter.ts` – Custom hook with tests
- **Responsive hooks:** `src/hooks/useIsMobile.ts` – `matchMedia`-based hook with cleanup tests
- **Utilities:** `src/utils/formatDate.ts` – Helper functions with tests
- **Storage helpers:** `src/utils/localStorage.ts` – Typed localStorage helpers with tests
- **Test fixtures:** `src/test/helpers.ts` – Fixture loading utilities for Vitest

## Testing Instructions

- Tests use Vitest + React Testing Library
- Test files should be co-located with source files or in `src/test/`
- `src/test/setup.ts` provides shared browser mocks such as `window.matchMedia`
- Use `src/test/helpers.ts` and `src/test/fixtures/` for fixture-driven tests when useful
- Run `npm run test:run` before committing
- All tests must pass before merging

```tsx
// ✅ Good test pattern
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

## Build and Deploy

- Production builds go to `dist/` directory
- GitHub Actions automatically deploys to GitHub Pages on push to `main`
- The build uses relative paths (`base: './'`) for GitHub Pages compatibility

## Boundaries

### ✅ Always Do

- Write TypeScript (never plain JavaScript)
- Add tests for new components and utilities
- Run `npm run lint` and `npm run test:run` before commits
- Use semantic HTML elements
- Follow existing code patterns and file structure

### ⚠️ Ask First

- Adding new dependencies
- Changing build configuration (`vite.config.ts`)
- Modifying CI/CD workflows
- Major architectural changes

### 🚫 Never Do

- Commit secrets, API keys, or credentials
- Modify `node_modules/` or `dist/`
- Use `any` type without justification
- Remove failing tests without fixing them
- Commit generated JavaScript files (TypeScript source is canonical)
