# Agent Guidelines for songshu-pindou-web

## Project Overview

This is a React 19 + TypeScript + Vite project with React Compiler enabled. It uses antd, react-router-dom, ahook, and zustand as core dependencies.

## Package Manager

**pnpm is required** for this project. Do not use npm or yarn.

```bash
# Install dependencies
pnpm install

# Development
pnpm run dev              # Start Vite dev server with HMR

# Production
pnpm run build            # TypeScript check + Vite build
pnpm run preview          # Preview production build

# Linting
pnpm run lint             # Run ESLint on entire codebase
```

## TypeScript Configuration

- **Strict mode enabled** (`strict: true`)
- **No unused locals/parameters** (`noUnusedLocals`, `noUnusedParameters`)
- **ES2023 target** with DOM and DOM.Iterable libs
- **Bundler module resolution** with `verbatimModuleSyntax`
- **React JSX**: `react-jsx` transform

## Code Style Guidelines

### TypeScript/React Conventions

1. **Component Files**: Use `.tsx` extension for components, `.ts` for utilities
2. **Naming**:
   - Components: PascalCase (e.g., `UserProfile`)
   - Hooks: camelCase with `use` prefix (e.g., `useUserData`)
   - Utilities/functions: camelCase (e.g., `formatDate`)
   - Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRIES`)
   - Types/Interfaces: PascalCase (e.g., `UserResponse`)
3. **Explicit Types**: Always annotate function parameters and return types when not obvious
4. **No Type Assertions**: Avoid `as` type assertions; prefer type guards
5. **Null Handling**: Use optional chaining (`?.`) and nullish coalescing (`??`) instead of loose checks

### Import Conventions

```tsx
// External libraries first
import { useState, useEffect } from 'react'
import { Button, Form } from 'antd'

// Internal modules
import { useAuthStore } from '@/store/auth'
import type { User } from '@/types'

// Relative imports (grouped)
import utils from './utils'
import './styles.css'
```

### React Patterns

1. **Functional Components Only**: Use function declarations or arrow functions
2. **Hooks Rules**: Follow React hooks rules (only call at top level)
3. **Component Composition**: Prefer composition over prop drilling
4. **Memoization**: Use `useMemo`/`useCallback` sparingly; profile first
5. **StrictMode**: Wrap app in StrictMode for development

### State Management (Zustand)

```tsx
// Store definition pattern
interface AuthStore {
  user: User | null
  login: (credentials: Credentials) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  login: async (credentials) => { /* ... */ },
  logout: () => set({ user: null }),
}))
```

### Error Handling

1. **Async Errors**: Always wrap async operations in try/catch
2. **Error Boundaries**: Use error boundaries for component tree failures
3. **Type Narrowing**: Use type guards for runtime type checking
4. **User Feedback**: Display errors using antd message/notification

### Formatting

- **Indentation**: 2 spaces
- **Semicolons**: Required (enforced by ESLint)
- **Quotes**: Single quotes for strings
- **Trailing Commas**: ES5 trailing commas in multiline
- **Max Line Length**: 100 characters (soft wrap)

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Buttons, inputs, etc.
│   └── layout/         # Layout components
├── pages/              # Route-level components
├── store/              # Zustand stores
├── hooks/              # Custom hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── assets/             # Static assets
└── App.tsx             # Root component
```

### Ant Design Usage

1. **Theme Customization**: Configure via ConfigProvider
2. **Tree Shaking**: Import components individually: `import { Button } from 'antd'`
3. **CSS**: Use CSS modules or global CSS; avoid inline styles

### React Router DOM Patterns

```tsx
// Route definitions
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
  </Routes>
</BrowserRouter>

// Navigation
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
navigate('/dashboard')
```

### ahook Usage

**优先使用 ahooks 中的 hook 替代频繁的 useState 与 useEffect**：

- `useRequest` - 不仅是数据请求，还适用于数据依赖更新、数据初始化、级联选择等场景
  - `ready` / `refresh` / `refreshDeps` - 手动控制请求时机与依赖更新
  - `polling` - 轮询任务
  - `debounce` / `throttle` - 防抖节流请求
  - `cache` / `staleTime` - 请求缓存与 stale 策略
  - `concurrency` - 并发控制
- `useDebounce`/`useThrottle` - performance optimization
- `useSet`/`useMap` - efficient Set/Map operations
- `useLocalStorage`/`useSessionStorage` - persistent state
- `useBoolean`/`useToggle` - boolean state management
- `useCounter` - counter state with increment/decrement
- `usePrevious` - track previous value
- `useMemo` - use `useMemo` from ahook for stable memoization

### React Compiler

The project uses `babel-plugin-react-compiler`. The compiler handles memoization automatically, but:
- Avoid patterns that confuse the compiler (side effects in render)
- Ensure stable component identities (stable keys, stable references)

## ESLint Configuration

The project uses:
- `@eslint/js` - base ESLint rules
- `typescript-eslint` - TypeScript support
- `eslint-plugin-react-hooks` - hooks rules
- `eslint-plugin-react-refresh` - HMR compatibility

Run `npm run lint` before committing to catch issues.

## Git Conventions

- **Commits**: Use conventional commit messages
- **Branch Names**: `feature/`, `fix/`, `chore/` prefixes
- **PR Description**: Clear description of changes and motivation
